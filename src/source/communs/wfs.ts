import { Projection } from 'ol/proj';
import { IGisRequest, IQueryResponse } from '../IExtended';
import { executeWfsQuery, loadWfsFeatureDescription, retrieveWfsFeature } from '../query';
import { Feature } from 'ol';
import { ITileWfsOptions } from '../TileWfs';
import { IWfsOptions } from '../Wfs';

/**
 * Surcharge le type en lui ajoutant ses attributs depuis une feature
 * @param options 
 * @returns 
 */
export function WFSInit(options: ITileWfsOptions | IWfsOptions): Promise<void> {
  return loadWfsFeatureDescription({
    url: options.url,
    type: options.type,
    version: options.version,
    outputFormat: options.outputFormat,
    requestProjectionCode: options.requestProjectionCode,
  });
}

/**
 * Exécute une requête WFS et retourne les features correspondantes
 * @param request 
 * @param onlyVisible (optionnel) (par défaut : false)
 * @returns 
 */
export async function WFSQuery(request: IGisRequest, onlyVisible = false): Promise<IQueryResponse> {
  const featureTypeResponse = await executeWfsQuery({
    source: this,
    url: 'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
    type: this.options.type,
    request,
    version: this.options.version,
    outputFormat: this.options.outputFormat,
    requestProjectionCode: this.options.requestProjectionCode,
    swapXYBBOXRequest: this.options.swapXYBBOXRequest,
    swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
  });

  return {
    request,
    featureTypeResponses: [featureTypeResponse],
  };
}

/**
 * Récupère une feature à partir de son id et de sa projection
 * @param id 
 * @param projection 
 * @returns 
 */
export function WFSRetrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
  return retrieveWfsFeature({
    url: 'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
    type: this.options.type,
    id,
    requestProjectionCode: this.options.requestProjectionCode,
    featureProjection: projection,
    version: this.options.version,
    outputFormat: this.options.outputFormat,
    swapXYBBOXRequest: this.options.swapXYBBOXRequest,
    swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
  });
}
