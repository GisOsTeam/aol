import WMSCapabilitiesFormat from 'ol/format/WMSCapabilities';
import { HttpEngine } from '../HttpEngine';
import { DEFAULT_WMS_VERSION, WmsVersion } from '../source/common/wms';

const parser = new WMSCapabilitiesFormat();

export interface IWmsLegendUrl {
  Format?: string;
  OnlineResource: string;
  size?: [number, number];
}

export interface IWmsStyle {
  Name: string;
  Title?: string;
  Abstract?: string;
  LegendURL?: IWmsLegendUrl[];
}

export interface IWmsCapabilityLayer {
  Name?: string;
  Title?: string;
  Style?: IWmsStyle[];
  Layer?: IWmsCapabilityLayer[];
}

export interface IWmsCapabilities {
  version: string;
  Capability: {
    Layer: IWmsCapabilityLayer;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface IFetchWmsCapabilitiesOptions {
  version?: WmsVersion;
  refresh?: boolean;
}

const capabilitiesCache = new Map<string, Promise<IWmsCapabilities>>();

/**
 * Récupère et parse le GetCapabilities d'un serveur WMS avec ol/format/WMSCapabilities.
 * Le résultat est mis en cache par url + version : un serveur WMS-r Géoplateforme, par exemple,
 * ne change pas ses capabilities assez souvent pour justifier une requête à chaque appel.
 * @param wmsUrl Url du endpoint WMS (sans query GetCapabilities)
 * @param options `version` (défaut 1.3.0) et `refresh` pour forcer une nouvelle requête
 */
export function fetchWmsCapabilities(
  wmsUrl: string,
  options: IFetchWmsCapabilitiesOptions = {},
): Promise<IWmsCapabilities> {
  const version = options.version || DEFAULT_WMS_VERSION;
  const cacheKey = `${wmsUrl}::${version}`;

  if (options.refresh) {
    capabilitiesCache.delete(cacheKey);
  }

  let pendingCapabilities = capabilitiesCache.get(cacheKey);
  if (!pendingCapabilities) {
    pendingCapabilities = HttpEngine.getInstance()
      .send({
        url: wmsUrl,
        params: {
          SERVICE: 'WMS',
          REQUEST: 'GetCapabilities',
          VERSION: version,
        },
        responseType: 'text',
      })
      .then((response) => {
        let capabilities: IWmsCapabilities | undefined;
        try {
          capabilities = parser.read(response.text) as IWmsCapabilities | undefined;
        } catch {
          capabilities = undefined;
        }
        if (!capabilities || !capabilities.Capability) {
          throw new Error(`Unable to parse WMS capabilities from '${wmsUrl}'`);
        }
        return capabilities;
      })
      .catch((error) => {
        // On ne met pas en cache un échec : un prochain appel doit pouvoir réessayer.
        capabilitiesCache.delete(cacheKey);
        throw error;
      });
    capabilitiesCache.set(cacheKey, pendingCapabilities);
  }
  return pendingCapabilities;
}

/**
 * Vide le cache des GetCapabilities.
 * Sans argument, vide tout le cache. Avec `wmsUrl` (et éventuellement `version`), ne vide que
 * l'entrée correspondant à ce serveur (utile pour forcer un rechargement complet, ou en tests).
 */
export function clearWmsCapabilitiesCache(
  wmsUrl?: string,
  options: Pick<IFetchWmsCapabilitiesOptions, 'version'> = {},
): void {
  if (wmsUrl == null) {
    capabilitiesCache.clear();
    return;
  }
  const version = options.version || DEFAULT_WMS_VERSION;
  capabilitiesCache.delete(`${wmsUrl}::${version}`);
}

/**
 * Recherche récursive d'une couche par son nom dans l'arbre de couches des capabilities
 * (gère les couches imbriquées : groupe > sous-groupe > couche).
 */
function findWmsCapabilityLayer(layer: IWmsCapabilityLayer | undefined, layerName: string): IWmsCapabilityLayer | null {
  if (!layer) {
    return null;
  }
  if (layer.Name === layerName) {
    return layer;
  }
  if (Array.isArray(layer.Layer)) {
    for (const subLayer of layer.Layer) {
      const found = findWmsCapabilityLayer(subLayer, layerName);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Retourne la liste des styles disponibles pour une couche (ex: ['normal', 'PCI vecteur']).
 * Retourne un tableau vide si la couche n'existe pas ou ne déclare aucun style.
 */
export function getWmsLayerStyles(capabilities: IWmsCapabilities, layerName: string): string[] {
  const layer = findWmsCapabilityLayer(capabilities?.Capability?.Layer, layerName);
  if (!layer || !Array.isArray(layer.Style)) {
    return [];
  }
  return layer.Style.map((style) => style.Name);
}

/**
 * Retourne l'url de la LegendURL statique déclarée dans le GetCapabilities pour le style demandé.
 * Si `styleName` est null/omis, retourne celle du premier style déclaré (le WMS 1.3.0 n'a pas
 * d'attribut standard "default" sur <Style> : la convention de facto est que ce premier style
 * déclaré est celui appliqué par le serveur quand STYLES est omis dans un GetMap).
 * Retourne null si la couche ou le style demandé n'existe pas, avec un console.warn listant
 * les styles disponibles pour faciliter le debug.
 */
export function getWmsLegendUrl(
  capabilities: IWmsCapabilities,
  layerName: string,
  styleName: string | null = null,
): string | null {
  const layer = findWmsCapabilityLayer(capabilities?.Capability?.Layer, layerName);
  const styles = layer?.Style;
  if (!layer || !Array.isArray(styles) || styles.length === 0) {
    console.warn(`[getWmsLegendUrl] Layer '${layerName}' not found or has no style declared in WMS capabilities.`);
    return null;
  }

  const style = styleName == null ? styles[0] : styles.find((candidate) => candidate.Name === styleName);
  if (!style) {
    console.warn(
      `[getWmsLegendUrl] Style '${styleName}' not found for layer '${layerName}'. Available styles: ${styles
        .map((candidate) => candidate.Name)
        .join(', ')}`,
    );
    return null;
  }

  const legendUrl = style.LegendURL && style.LegendURL[0] && style.LegendURL[0].OnlineResource;
  if (!legendUrl) {
    console.warn(`[getWmsLegendUrl] Style '${style.Name}' of layer '${layerName}' has no LegendURL declared.`);
    return null;
  }
  return legendUrl;
}
