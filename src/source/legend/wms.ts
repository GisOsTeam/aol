import { srcToImage, getWmsLayersFromTypes, loadImageAsDataUrlWithHttpEngine } from '../../utils';
import { ILegendRecord, ILegendSource } from '../IExtended';
import { fetchWmsCapabilities, getWmsLegendUrl } from '../../utils/wms-capabilities';

export async function loadLegendWms(
  source: ILegendSource,
  { loadWithHttpEngine = false }: { loadWithHttpEngine: boolean },
): Promise<ILegendRecord> {
  if (typeof (source as any).getLegendUrl === 'function') {
    const key = getWmsLayersFromTypes((source as any).options.types);
    const dynamicUrl = (source as any).getLegendUrl(undefined, { TRANSPARENT: true, SLD_VERSION: '1.1.0' });

    let resolvedUrl: string;
    let image: HTMLImageElement;
    try {
      resolvedUrl = loadWithHttpEngine ? await loadImageAsDataUrlWithHttpEngine(dynamicUrl) : dynamicUrl;
      image = await srcToImage(resolvedUrl, { emptyImageOnError: false });
    } catch {
      // Cas ou le GetLegendGraphic n'est pas accéssible (opération optionnelle de la norme WMS,
      // non implémentée par certains serveurs, ex: le WMS-r Géoplateforme de l'IGN) :
      // on retombe sur la LegendURL statique déclarée dans le GetCapabilities.
      const wmsUrl: string = (source as any).options.url;
      const version = (source as any).options.version;
      const capabilities = await fetchWmsCapabilities(wmsUrl, { version });
      const staticLegendUrl = getWmsLegendUrl(capabilities, key);
      if (!staticLegendUrl) {
        throw new Error(
          `Unable to load legend for WMS layer '${key}': GetLegendGraphic is not available and no static LegendURL was found in the capabilities of '${wmsUrl}'.`,
        );
      }
      resolvedUrl = staticLegendUrl;
      image = await srcToImage(staticLegendUrl);
    }

    return {
      [key]: [
        {
          image,
          srcImage: resolvedUrl,
          height: image.height,
          width: image.width,
        },
      ],
    };
  }
  return Promise.reject(new Error('Source is not a WMS source'));
}
