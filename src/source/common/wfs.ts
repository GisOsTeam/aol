import { Projection } from 'ol/proj';
import { IGisRequest, IQueryResponse, IQuerySource } from '../IExtended';
import { executeWfsQuery, loadDescribeFeatureType, loadWfsFeatureDescription, retrieveWfsFeature } from '../query';
import { Feature } from 'ol';
import { ITileWfsOptions } from '../TileWfs';
import { IWfsOptions } from '../Wfs';

export enum WfsVersionEnum {
  V1_0_0 = '1.0.0',
  V1_1_0 = '1.1.0',
  V2_0_0 = '2.0.0',
}
// Type wfs version from enum, keep string union for backward compatibility with old versions of wfs module
export type WfsVersion = '1.0.0' | '1.1.0' | '2.0.0' | WfsVersionEnum;

export const DEFAULT_VERSION: WfsVersion = WfsVersionEnum.V1_1_0;
export const DEFAULT_OUTPUT_FORMAT = 'text/xml; subtype=gml/3.1.1';
export const DEFAULT_PROJECTION_CODE = 'EPSG:4326';

/**
 * Surcharge le type en lui ajoutant ses attributs depuis une feature
 * @param options
 * @returns
 */
export function WFSInit(options: ITileWfsOptions | IWfsOptions): Promise<void> {
  return loadWfsFeatureDescription({
    url: options.url,
    type: options.type,
    version: options.version ?? DEFAULT_VERSION,
    outputFormat: options.outputFormat ?? DEFAULT_OUTPUT_FORMAT,
    requestProjectionCode: options.requestProjectionCode ?? DEFAULT_PROJECTION_CODE,
  });
}

/**
 * Charge la descrition d'une feature depuis le XSD retourné par une requête DescribeFeatureType.
 * Si DescribeFeatureType n'est pas supporté,
 * tente de deviner la description à partir d'une requête GetFeature avec outputFormat application/json
 * @param options
 * @returns
 */
export async function WFSLoadDescription(options: ITileWfsOptions | IWfsOptions): Promise<void> {
  const internalOptions = {
    url: options.url,
    type: options.type,
    version: options.version ?? DEFAULT_VERSION,
    outputFormat: options.outputFormat ?? DEFAULT_OUTPUT_FORMAT,
    requestProjectionCode: options.requestProjectionCode ?? DEFAULT_PROJECTION_CODE,
  };
  const describeFeatureTypeSuccess = await loadDescribeFeatureType(internalOptions);

  if (describeFeatureTypeSuccess == false) {
    // DescribeFeatureType non supporté, fallback sur GetFeature
    await loadWfsFeatureDescription(internalOptions);
  }
}

/**
 * Exécute une requête WFS et retourne les features correspondantes
 * @param source
 * @param request
 * @param onlyVisible (optionnel) (par défaut : false)
 * @param options
 * @returns
 */
export async function WFSQuery(
  source: IQuerySource,
  request: IGisRequest,
  options: ITileWfsOptions | IWfsOptions,
  onlyVisible = false,
): Promise<IQueryResponse> {
  const featureTypeResponse = await executeWfsQuery({
    source: source,
    url: options.url,
    type: options.type,
    request,
    version: options.version ?? DEFAULT_VERSION,
    outputFormat: options.outputFormat ?? DEFAULT_OUTPUT_FORMAT,
    requestProjectionCode: options.requestProjectionCode ?? DEFAULT_PROJECTION_CODE,
    swapXYBBOXRequest: options.swapXYBBOXRequest ?? false,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult ?? false,
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
export function WFSRetrieveFeature(
  id: number | string,
  projection: Projection,
  options: ITileWfsOptions | IWfsOptions,
): Promise<Feature> {
  return retrieveWfsFeature({
    url: options.url,
    type: options.type,
    id,
    requestProjectionCode: options.requestProjectionCode ?? DEFAULT_PROJECTION_CODE,
    featureProjection: projection,
    version: options.version ?? DEFAULT_VERSION,
    outputFormat: options.outputFormat ?? DEFAULT_OUTPUT_FORMAT,
    swapXYBBOXRequest: options.swapXYBBOXRequest ?? false,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult ?? false,
  });
}
