import { Projection } from 'ol/proj';
import { IPredicate } from '../../filter/predicate';
import {
  IConfigurableSource,
  IFeatureType,
  IFetchLegendOptions,
  IGisRequest,
  ILayerLegend,
  ILegendSource,
  IQueryFeatureTypeResponse,
  IQueryResponse,
  IQuerySource,
  ISnapshotOptions,
  ISnapshotSource,
} from '../IExtended';
import {
  executeWfsQuery,
  executeWmsQuery,
  loadWmsFeatureDescription,
  retrieveWfsFeature,
  retrieveWmsFeature,
} from '../query';
import { WFSLoadDescription, WfsVersionEnum } from './wfs';
import { Feature } from 'ol';
import { getWmsLayersFromTypes } from '../../utils';
import { loadLegendWms } from '../legend';
import { FilterBuilder, FilterBuilderTypeEnum } from '../../filter';
import BaseObject from 'ol/Object';

export enum WmsVersionEnum {
  V1_0_0 = '1.0.0',
  V1_1_0 = '1.1.0',
  V1_3_0 = '1.3.0',
}
// Type wms version from enum, keep string union for backward compatibility with old versions of wms module
export type WmsVersion = '1.0.0' | '1.1.0' | '1.3.0' | WmsVersionEnum;

export interface ICommonWmsOptions extends ISnapshotOptions {
  limit?: number;
  loadImagesWithHttpEngine?: boolean;
  queryWfsUrl?: string | null; // For Wfs query instead of Wms query
  queryMethod?: 'GET' | 'POST';
  queryFormat?: string;
  requestProjectionCode?: string;
  swapLonLatGeometryResult?: boolean;
  swapXYBBOXRequest?: boolean;
  types: IFeatureType<string>[];
  url: string;
  version?: WmsVersion;
}

export interface IWMSLoadFunctionAccessor<T> {
  getLoadFunction(): WMSLoadFunction<T>;
  setLoadFunction(loadFunction: WMSLoadFunction<T>): void;
}

export type WMSLoadFunction<T> = (arg: T, p1: string) => void;

export const DEFAULT_WMS_VERSION: WmsVersion = WmsVersionEnum.V1_3_0;
export const DEFAULT_WMS_QUERY_FORMAT = 'text/xml; subtype=gml/3.1.1';
export const DEFAULT_WMS_PROJECTION_CODE = 'EPSG:3857';
export const DEFAULT_WMS_LIMIT = 10000;
export const DEFAULT_WMS_OPTIONS: Pick<
  ICommonWmsOptions,
  | 'queryMethod'
  | 'queryFormat'
  | 'version'
  | 'requestProjectionCode'
  | 'swapLonLatGeometryResult'
  | 'swapXYBBOXRequest'
  | 'limit'
  | 'loadImagesWithHttpEngine'
> = {
  limit: DEFAULT_WMS_LIMIT,
  loadImagesWithHttpEngine: false,
  queryMethod: 'GET',
  queryFormat: DEFAULT_WMS_QUERY_FORMAT, // 'application/json',
  requestProjectionCode: DEFAULT_WMS_PROJECTION_CODE,
  swapLonLatGeometryResult: false,
  swapXYBBOXRequest: false,
  version: DEFAULT_WMS_VERSION,
};

/**
 * Merge les options d'une source WMS (TileWms ou Wms) :
 *  - merge les options passées en paramètre avec les options existantes
 * @param options
 * @returns
 */
export function WMSMergeOptions<T extends ICommonWmsOptions>(oldOptions: Partial<T>, newOptions: Partial<T>): T {
  return {
    ...oldOptions,
    ...newOptions,
  } as T;
}

/**
 * Initialise les options d'une source WMS (TileWms ou Wms) :
 *  - merge les options passées en paramètre avec les options par défaut
 *  - définit snapshotable, listable et removable à true si elles ne sont pas définies ou à false
 * @param options
 * @returns
 */
export function WMSInitializeOptions<T extends ICommonWmsOptions>(options: T): Required<T> {
  const mergedOptions = WMSMergeOptions<T>(DEFAULT_WMS_OPTIONS as Partial<T>, options) as Required<T>;
  if (mergedOptions.snapshotable != false) {
    mergedOptions.snapshotable = true;
  }
  if (mergedOptions.listable != false) {
    mergedOptions.listable = true;
  }
  if (mergedOptions.removable != false) {
    mergedOptions.removable = true;
  }
  if (mergedOptions.queryWfsUrl == null) {
    mergedOptions.queryWfsUrl = null;
  }
  return mergedOptions;
}

/**
 * Récupère la map des prédicats de chaque type de la source WMS (TileWms ou Wms)
 * @param types
 * @returns
 */
export function WMSGetTypePredicateAsMap(types: IFeatureType<string>[]): Map<string, IPredicate> {
  const typePredicateAsMap = new Map<string, IPredicate>();
  for (const type of types) {
    if (!typePredicateAsMap.has(type.id) && type.predicate) {
      typePredicateAsMap.set(type.id, type.predicate);
    }
  }
  return typePredicateAsMap;
}

/**
 * Fonction d'initialisation d'une source WMS (TileWms ou Wms) :
 *  - charge la description de la feature et la stocke dans la source
 * @param options
 * @param source
 * @returns
 */
export async function WMSInit(options: Required<ICommonWmsOptions>, source: ISnapshotSource): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const type of options.types) {
    if (options.queryWfsUrl !== null) {
      promises.push(
        WFSLoadDescription({
          url: options.queryWfsUrl,
          type,
          version: WfsVersionEnum.V1_0_0, // Do not use version option !
          outputFormat: options.queryFormat,
          requestProjectionCode: options.requestProjectionCode,
          swapXYBBOXRequest: options.swapXYBBOXRequest,
          swapLonLatGeometryResult: options.swapLonLatGeometryResult,
        }),
      );
    } else {
      promises.push(WMSLoadDescription(options, type));
    }
  }

  await Promise.all(promises);

  source.setSourceOptions(options);
}

export function WMSSetSourceOptions<Options extends ICommonWmsOptions, T>(
  newOptions: Options,
  source: IConfigurableSource & BaseObject,
  getLoadFunction: () => WMSLoadFunction<T>,
  setLoadFunction: (loadFunction: WMSLoadFunction<T>) => void,
  newImageLoadFunction: WMSLoadFunction<T>,
  defaultLoadFunction: WMSLoadFunction<T> | undefined,
  defaultTypePredicateAsMap: Map<string, IPredicate>,
  params: Record<string, unknown>,
  handlePropertyChange: (event: any) => void,
): void {
  const mergedOptions = WMSMergeOptions(DEFAULT_WMS_OPTIONS, newOptions);
  source.un('propertychange', handlePropertyChange);
  source.set('types', mergedOptions.types);

  const mergedParams: Record<string, unknown> = {
    ...params,
    TRANSPARENT: 'TRUE',
    LAYERS: getWmsLayersFromTypes(mergedOptions.types),
    VERSION: mergedOptions.version,
    NOW: Date.now(),
    CQL_FILTER: undefined,
  };
  const cqlFilter = WMSBuildFilter(mergedOptions.types, defaultTypePredicateAsMap);
  if (cqlFilter && cqlFilter !== '') {
    mergedParams.CQL_FILTER = cqlFilter;
  }

  if (mergedOptions.loadImagesWithHttpEngine) {
    // Save default OL function
    if (defaultLoadFunction === undefined) {
      defaultLoadFunction = getLoadFunction();
    }

    // Register custom tile load funtion with HttpEngine use
    setLoadFunction(newImageLoadFunction);
  } else if (defaultLoadFunction !== undefined) {
    // There was a custom function : unregister it and restore default OL function
    setLoadFunction(defaultLoadFunction);
    defaultLoadFunction = undefined;
  }

  source.updateParams(mergedParams);
  source.on('propertychange', handlePropertyChange);
}

/**
 * Fonction d'initialisation d'une source WMS (TileWms ou Wms) :
 *  - charge la description de la feature et la stocke dans la source
 * @param options
 * @returns
 */
export function WMSLoadDescription(options: Required<ICommonWmsOptions>, type: IFeatureType<string>): Promise<void> {
  return loadWmsFeatureDescription({
    url: options.url,
    type,
    method: options.queryMethod,
    version: options.version,
    outputFormat: options.queryFormat,
    requestProjectionCode: options.requestProjectionCode,
  });
}

export async function WMSQuery(
  source: IQuerySource,
  request: IGisRequest,
  options: Required<ICommonWmsOptions>,
  onlyVisible = false,
): Promise<IQueryResponse> {
  const promises: Promise<IQueryFeatureTypeResponse>[] = [];
  for (const type of options.types) {
    const isVisible = type.hide !== true;
    if (!onlyVisible || isVisible) {
      if (options.queryWfsUrl !== null) {
        if (!request.method) {
          request.method = options.queryMethod;
        }

        promises.push(
          executeWfsQuery({
            source: source,
            url: options.queryWfsUrl,
            type,
            request,
            requestProjectionCode: options.requestProjectionCode,
            version: WfsVersionEnum.V1_0_0, // Do not use version option !
            outputFormat: options.queryFormat,
            swapXYBBOXRequest: options.swapXYBBOXRequest,
            swapLonLatGeometryResult: options.swapLonLatGeometryResult,
          }),
        );
      } else {
        promises.push(
          executeWmsQuery({
            source: source,
            url: options.url,
            type,
            request,
            method: options.queryMethod,
            requestProjectionCode: options.requestProjectionCode,
            version: options.version,
            outputFormat: options.queryFormat,
            swapXYBBOXRequest: options.swapXYBBOXRequest,
            swapLonLatGeometryResult: options.swapLonLatGeometryResult,
          }),
        );
      }
    }
  }
  return Promise.all(promises).then((featureTypeResponses: IQueryFeatureTypeResponse[]) => {
    return {
      request,
      featureTypeResponses,
    };
  });
}

/**
 * Charge la description de la feature pour chaque type de la source WMS (TileWms ou Wms) :
 *  - si DescribeFeatureType est supporté, charge la description depuis le XSD retourné par une requête DescribeFeatureType
 *  - sinon, tente de deviner la description à partir d'une requête GetFeature avec outputFormat application/json
 * @param options
 * @returns
 */
export async function WMSRetrieveFeature(
  id: number | string,
  projection: Projection,
  options: Required<ICommonWmsOptions>,
): Promise<Feature | undefined> {
  const promises: Promise<Feature | undefined>[] = [];
  for (const type of options.types) {
    if (options.queryWfsUrl != null) {
      promises.push(
        retrieveWfsFeature({
          url: options.queryWfsUrl,
          type,
          id,
          requestProjectionCode: options.requestProjectionCode,
          featureProjection: projection,
          version: '1.1.0', // Do not use version option !
          outputFormat: options.queryFormat,
          swapXYBBOXRequest: options.swapXYBBOXRequest,
          swapLonLatGeometryResult: options.swapLonLatGeometryResult,
        }),
      );
    } else {
      promises.push(
        retrieveWmsFeature({
          url: options.url,
          type,
          id,
          requestProjectionCode: options.requestProjectionCode,
          featureProjection: projection,
          method: options.queryMethod,
          version: options.version,
          outputFormat: options.queryFormat,
          swapLonLatGeometryResult: options.swapLonLatGeometryResult,
        }),
      );
    }
  }
  return (await Promise.all(promises)).find((f) => f !== undefined);
}

/**
 * Fonction de gestion des changements de propriétés d'une source WMS (TileWms ou Wms) :
 *  - met à jour les paramètres de la source en fonction des propriétés modifiées
 * @param event
 * @param options
 * @param source
 */
export function WMSHandlePropertyChange(
  event: any,
  options: Required<ICommonWmsOptions>,
  source: IConfigurableSource,
): void {
  const key = event.key;
  const value = event.target.get(key);
  if (key === 'types') {
    source.updateParams({
      ...source.getParams(),
      TRANSPARENT: 'TRUE',
      LAYERS: getWmsLayersFromTypes(value),
      VERSION: options.version,
    });
    options.types = value;
  }
}

/**
 * Fonction de récupération de la légende d'une source WMS (TileWms ou Wms) :
 *  - si la légende est déjà chargée et que l'option refresh n'est pas à true, retourne la légende stockée dans la source
 *  - sinon, charge la légende depuis le serveur WMS et la stocke dans la source
 * @param source
 * @param fetchLegendoptions
 * @param fetchOptions
 * @returns
 */
export async function WMSFetchLegend(
  currentLegendByLayer: Record<string, ILayerLegend[]>,
  source: ILegendSource,
  commonWmsOptions: Required<ICommonWmsOptions>,
  fetchLegendoptions?: IFetchLegendOptions,
): Promise<Record<string, ILayerLegend[]>> {
  if (!fetchLegendoptions) {
    fetchLegendoptions = {};
  }
  let loadWithHttpEngine = commonWmsOptions.loadImagesWithHttpEngine;
  if (fetchLegendoptions.forceLoadWithHttpEngine != null) {
    loadWithHttpEngine = fetchLegendoptions.forceLoadWithHttpEngine;
  }
  if (!fetchLegendoptions.refresh) {
    fetchLegendoptions.refresh = false;
  }

  if (currentLegendByLayer && fetchLegendoptions.refresh == false) {
    return currentLegendByLayer;
  }
  return await loadLegendWms(source, { loadWithHttpEngine });
}

export function WMSBuildFilter(
  types: IFeatureType<string>[],
  defaultTypePredicateAsMap: Map<string, IPredicate>,
): string {
  if (!types || types.length === 0) {
    return '';
  }

  let filters: string = '';
  for (const type of types) {
    const filterBuilder = buildFilterBuilderFromType(type, defaultTypePredicateAsMap);
    if (filterBuilder.predicate) {
      if (filters === '') {
        filters = '';
      } else {
        filters += ';';
      }
      filters += filterBuilder.build(FilterBuilderTypeEnum.CQL);
    }
  }
  return filters;
}

function buildFilterBuilderFromType(
  type: IFeatureType<string>,
  defaultTypePredicateAsMap: Map<string, IPredicate>,
): FilterBuilder {
  let filterBuilder = new FilterBuilder();
  if (defaultTypePredicateAsMap && defaultTypePredicateAsMap instanceof Map && defaultTypePredicateAsMap.has(type.id)) {
    const predicate = defaultTypePredicateAsMap.get(type.id);
    if (predicate) {
      filterBuilder.from(predicate);
    }
  }

  if (type.predicate && filterBuilder.predicate?.hashCode() !== type.predicate.hashCode()) {
    filterBuilder = filterBuilder.and(type.predicate);
  }

  return filterBuilder;
}
