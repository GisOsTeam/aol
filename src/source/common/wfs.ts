import { Projection } from 'ol/proj';
import { IFeatureType, IGisRequest, IQueryResponse, IQuerySource, ISnapshotOptions } from '../IExtended';
import { executeWfsQuery, loadDescribeFeatureType, loadWfsFeatureDescription, retrieveWfsFeature } from '../query';
import { Feature } from 'ol';

export interface ICommonWfsOptions extends ISnapshotOptions {
  url: string;
  type: IFeatureType<string>;
  method?: 'GET' | 'POST';
  outputFormat?: string;
  requestProjectionCode?: string;
  version?: WfsVersion;
  swapXYBBOXRequest?: boolean;
  swapLonLatGeometryResult?: boolean;
  limit?: number;
}

export enum WfsVersionEnum {
  V1_0_0 = '1.0.0',
  V1_1_0 = '1.1.0',
  V2_0_0 = '2.0.0',
}
// Type wfs version from enum, keep string union for backward compatibility with old versions of wfs module
export type WfsVersion = '1.0.0' | '1.1.0' | '2.0.0' | WfsVersionEnum;

export const DEFAULT_WFS_VERSION: WfsVersion = WfsVersionEnum.V1_1_0;
export const DEFAULT_WFS_OUTPUT_FORMAT = 'text/xml; subtype=gml/3.1.1';
export const DEFAULT_WFS_PROJECTION_CODE = 'EPSG:3857';
export const DEFAULT_WFS_LIMIT = 1000;
export const DEFAULT_WFS_OPTIONS: Pick<
  ICommonWfsOptions,
  'outputFormat' | 'version' | 'requestProjectionCode' | 'swapXYBBOXRequest' | 'swapLonLatGeometryResult' | 'limit'
> = {
  outputFormat: DEFAULT_WFS_OUTPUT_FORMAT, // 'application/json',
  version: DEFAULT_WFS_VERSION,
  requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
  swapXYBBOXRequest: false,
  swapLonLatGeometryResult: false,
  limit: DEFAULT_WFS_LIMIT,
};

/**
 * Initialise les options d'une source WFS (TileWfs ou Wfs) :
 *  - merge les options passées en paramètre avec les options par défaut
 *  - définit snapshotable, listable et removable à true si elles ne sont pas définies ou à false
 * @param options
 * @returns
 */
export function WFSInitializeOptions<T extends ICommonWfsOptions>(options: T): Required<T> {
  const mergedOptions = WFSMergeOptions<T>(DEFAULT_WFS_OPTIONS as Partial<T>, options);
  if (mergedOptions.snapshotable != false) {
    mergedOptions.snapshotable = true;
  }
  if (mergedOptions.listable != false) {
    mergedOptions.listable = true;
  }
  if (mergedOptions.removable != false) {
    mergedOptions.removable = true;
  }
  return mergedOptions;
}

/**
 * Merge les options d'une source WFS (TileWfs ou Wfs) :
 *  - merge les options passées en paramètre avec les options existantes
 * @param oldOptions
 * @param newOptions
 * @returns
 */
export function WFSMergeOptions<T extends ICommonWfsOptions>(
  oldOptions: Partial<T>,
  newOptions: Partial<T>,
): Required<T> {
  return {
    ...oldOptions,
    ...newOptions,
  } as Required<T>;
}

/**
 * Fonction d'initialisation d'une source WFS (TileWfs ou Wfs) :
 *  - charge la description de la feature et la stocke dans la source
 * @param options
 * @returns
 */
export async function WFSInit(options: ICommonWfsOptions): Promise<void> {
  await WFSLoadDescription(options);
}

/**
 * Charge la descrition d'une feature depuis le XSD retourné par une requête DescribeFeatureType.
 * Si DescribeFeatureType n'est pas supporté,
 * tente de deviner la description à partir d'une requête GetFeature avec outputFormat application/json
 * @param options
 * @returns
 */
export async function WFSLoadDescription(options: ICommonWfsOptions): Promise<void> {
  const internalOptions = {
    url: options.url,
    type: options.type,
    version: options.version ?? DEFAULT_WFS_VERSION,
    method: options.method ?? 'GET',
    outputFormat: options.outputFormat ?? DEFAULT_WFS_OUTPUT_FORMAT,
    requestProjectionCode: options.requestProjectionCode ?? DEFAULT_WFS_PROJECTION_CODE,
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
  options: ICommonWfsOptions,
  onlyVisible = false,
): Promise<IQueryResponse> {
  if (!request.method) {
    request.method = options.method ?? 'GET';
  }

  const featureTypeResponse = await executeWfsQuery({
    source: source,
    url: options.url,
    type: options.type,
    request,
    version: options.version ?? DEFAULT_WFS_VERSION,
    outputFormat: options.outputFormat ?? DEFAULT_WFS_OUTPUT_FORMAT,
    requestProjectionCode: options.requestProjectionCode ?? DEFAULT_WFS_PROJECTION_CODE,
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
  options: ICommonWfsOptions,
): Promise<Feature | undefined> {
  return retrieveWfsFeature({
    url: options.url,
    type: options.type,
    id,
    method: options.method ?? 'GET',
    requestProjectionCode: options.requestProjectionCode ?? DEFAULT_WFS_PROJECTION_CODE,
    featureProjection: projection,
    version: options.version ?? DEFAULT_WFS_VERSION,
    outputFormat: options.outputFormat ?? DEFAULT_WFS_OUTPUT_FORMAT,
    swapXYBBOXRequest: options.swapXYBBOXRequest ?? false,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult ?? false,
  });
}
