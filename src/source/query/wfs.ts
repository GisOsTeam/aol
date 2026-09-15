import Feature from 'ol/Feature';
import { transformExtent } from 'ol/proj';
import {
  IAttribute,
  IFeatureType,
  IGisRequest,
  IIdentifyRequest,
  IQueryFeatureTypeResponse,
  IQuerySource,
  QueryType,
} from '../IExtended';
import { buffer, disjoint, getQueryId, toGeoJSONFeature, toGeoJSONGeometry, toOpenLayersGeometry } from '../../utils';
import { Extent } from 'ol/extent';
import Geometry from 'ol/geom/Geometry';
import Projection from 'ol/proj/Projection';
import { readFeatures } from '../../utils/featuresRead';
import { calculateGeoExtent } from '../../utils/extent';
import { HttpEngine } from '../../HttpEngine';
import { escapeXmlAttribute, FieldTypeEnum, FilterBuilder, FilterBuilderTypeEnum } from '../../filter';
import { IPredicate, SpatialPre } from '../../filter/predicate';
import { OperatorEnum } from '../../filter/operator';
import { DEFAULT_WFS_LIMIT, DEFAULT_WFS_VERSION, WfsVersion, WfsVersionEnum } from '../common';
import { parseDescribeFeatureType } from '../parser/wfs-describe-feature-type.parser';

export interface IExecuteWfsQueryOptions {
  filterFormat?: OgcFilterFormat; // Défaut : CQL_FILTER en KVP (comportement historique)
  outputFormat: string;
  request: IGisRequest;
  requestProjectionCode: string;
  source: IQuerySource;
  swapLonLatGeometryResult: boolean;
  swapXYBBOXRequest: boolean;
  type: IFeatureType<string>;
  url: string;
  version: WfsVersion; // On conserve pour ne pas apporter de breaking change
}

/**
 * Format de filtre utilisé pour interroger le serveur WFS :
 * - CQL (défaut) : filtre rendu en CQL_FILTER, transmis en KVP (GET ou POST urlencoded).
 * - OGC : filtre rendu en FES 2.0 (<fes:Filter>), transmis dans un corps <wfs:GetFeature> XML
 *   en POST. Nécessite version = '2.0.0' (FES 2.0 n'existe pas pour les WFS 1.0.0/1.1.0).
 */
export type OgcFilterFormat = FilterBuilderTypeEnum.CQL | FilterBuilderTypeEnum.FES;

export interface ILoadWfsFeatureOptions {
  bbox: number[];
  cql?: string; // Override type predicate CQL if provided (ignoré si filterFormat = OGC, voir overrideFilters)
  featureProjectionCode: string;
  filterFormat?: OgcFilterFormat;
  filters?: IPredicate;
  id?: number | string;
  limit: number;
  method: 'GET' | 'POST';
  outputFormat: string;
  overrideFilters?: IPredicate; // Équivalent de `cql` pour filterFormat = OGC
  queryType: QueryType;
  requestProjectionCode: string;
  swapLonLatGeometryResult?: boolean;
  swapXYBBOXRequest?: boolean;
  type: IFeatureType<string>;
  url: string;
  version: WfsVersion;
}

export interface IRetrieveWfsFeaturesOptions {
  featureProjection: Projection;
  id: number | string;
  method?: 'GET' | 'POST';
  outputFormat: string;
  requestProjectionCode: string;
  swapLonLatGeometryResult: boolean;
  swapXYBBOXRequest: boolean;
  type: IFeatureType<string>;
  url: string;
  version: WfsVersion; // On conserve pour ne pas apporter de breaking change
}

export interface ILoadWfsFeatureDescriptionOptions {
  url: string;
  type: IFeatureType<string>;
  version: WfsVersion;
  method?: 'GET' | 'POST';
  outputFormat: string;
  requestProjectionCode: string;
}

export const DEFAULT_RESOLUTION = 1;
export const DEFAULT_TOLERANCE = 1;

interface IRetrieveWfsFeaturesDefaultOptions {
  featureProjection: Projection;
  filterFormat?: OgcFilterFormat;
  filters: IPredicate;
  limit: number;
  method: 'GET' | 'POST';
  outputFormat: string;
  overrideFilters: IPredicate | undefined;
  requestProjectionCode: string;
  swapLonLatGeometryResult: boolean;
  swapXYBBOXRequest: boolean;
  type: IFeatureType<string>;
  url: string;
  version: WfsVersion;
}

interface IRetrieveWfsFeaturesWithGeometryOptions extends IRetrieveWfsFeaturesDefaultOptions {
  geometry: Geometry;
  geometryProjection: Projection;
  identifyTolerance: number;
  mapResolution: number;
  queryType: QueryType;
}

interface IRetrieveWfsFeaturesWithoutGeometryOptions extends IRetrieveWfsFeaturesDefaultOptions { }

export async function executeWfsQuery(options: IExecuteWfsQueryOptions): Promise<IQueryFeatureTypeResponse> {
  const { geometry } = options.request;

  // Cas d'une requête sans dimension spatiale
  if (!geometry) {
    const optionsWithoutGeometry = ewqoToRwfwogoTransformer(options);
    const features = await retrieveWfsFeaturesWithoutGeometry(optionsWithoutGeometry);
    return wfsFeatureToQueryFeatureTypeResponseMapper(features, options.type, options.source);
  }

  const optionsWithGeometry = ewqoToRwfwgoTransformer(options);
  const allFeatures = await retrieveWfsFeaturesWithBBOXFromGeometry(optionsWithGeometry);
  const filteredFeatures = filterFeaturesByGeometry(allFeatures, optionsWithGeometry);
  return wfsFeatureToQueryFeatureTypeResponseMapper(filteredFeatures, options.type, options.source);
}

export async function loadWfsFeaturesOnBBOX(options: ILoadWfsFeatureOptions): Promise<Feature[]> {
  if (options.filterFormat === FilterBuilderTypeEnum.FES) {
    return loadWfsFeaturesWithFesFilter(options);
  }

  const params = buildWfsRequestParams(options);
  const isPost = options.method === 'POST';

  const res = await HttpEngine.getInstance().send({
    url: options.url,
    method: options.method,
    params: isPost ? undefined : params,
    body: isPost ? params : undefined,
    contentType: isPost ? 'application/x-www-form-urlencoded' : undefined,
    responseType: 'text',
  });

  // Retry en POST si GET retourne 414 (URI Too Long)
  if (res.status === 414 && !isPost) {
    const retryRes = await HttpEngine.getInstance().send({
      url: options.url,
      method: 'POST',
      body: params,
      contentType: 'application/x-www-form-urlencoded',
      responseType: 'text',
    });
    if (retryRes.status !== 200) {
      throw new Error('WFS BBOX request error ' + retryRes.status + ' (POST retry after 414)');
    }
    return readFeatures(retryRes.text, options);
  }

  if (res.status !== 200) {
    throw new Error('WFS BBOX request error ' + res.status);
  }
  return readFeatures(res.text, options);
}

/**
 * WFS 2.0.0 GetFeature as an XML POST body, filter encoded as FES 2.0 (<fes:Filter>) instead of
 * CQL_FILTER. Used when options.filterFormat === FilterBuilderTypeEnum.FES.
 *
 * Not supported here: fetching by id (options.id / fes:ResourceId) - callers using that (see
 * retrieveWfsFeature, loadWfsFeatureDescription) never set filterFormat, so they keep using the
 * CQL/KVP path above regardless of a source's configured filterFormat.
 */
async function loadWfsFeaturesWithFesFilter(options: ILoadWfsFeatureOptions): Promise<Feature[]> {
  if (options.version !== WfsVersionEnum.V2_0_0) {
    throw new Error(
      `filterFormat FES requires WFS version '2.0.0' (FES 2.0 is not available for version '${options.version}')`,
    );
  }

  const predicate = buildOgcFilterPredicate(options);
  const body = buildGetFeatureRequestXml(options, predicate);

  const res = await HttpEngine.getInstance().send({
    url: options.url,
    method: 'POST',
    body,
    contentType: 'application/xml',
    responseType: 'text',
  });

  const owsException = extractOwsExceptionText(res.text);
  if (res.status !== 200 || owsException != null) {
    throw new Error(`WFS GetFeature request error: ${owsException ?? `status ${res.status}`}`);
  }
  return readFeatures(res.text, options);
}

/**
 * Combines options.overrideFilters (if set, used alone - mirrors the CQL path's `cql` override),
 * or otherwise options.filters + options.type.predicate + the bbox (as a BBOX SpatialPre, always
 * ANDed in when present - unlike the CQL path, FES has no separate "just BBOX" KVP parameter to
 * fall back to).
 */
function buildOgcFilterPredicate(options: ILoadWfsFeatureOptions): IPredicate | undefined {
  if (options.overrideFilters != null) {
    return options.overrideFilters;
  }

  const filterBuilder = new FilterBuilder();
  if (options.filters) {
    filterBuilder.from(options.filters);
  }
  if (options.type?.predicate != null) {
    filterBuilder.from(options.type.predicate);
  }

  if (options.bbox != null && options.bbox.length === 4) {
    const geometryName = options.type?.geometryAttribute?.key ?? 'the_geom';
    const bboxPredicate = new SpatialPre(
      { key: geometryName, type: FieldTypeEnum.Geometry },
      buildBboxCoordinatesString(options, true),
      SpatialPre.buildOperator(OperatorEnum.BBOX),
    );
    filterBuilder.and(bboxPredicate);
  }

  return filterBuilder.predicate;
}

function buildGetFeatureRequestXml(options: ILoadWfsFeatureOptions, predicate: IPredicate | undefined): string {
  const typeName = getQueryId<string>(options.type);
  const filterXml = predicate ? `<fes:Filter>${predicate.toString(FilterBuilderTypeEnum.FES)}</fes:Filter>` : '';
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<wfs:GetFeature service="WFS" version="2.0.0" count="${options.limit}" ` +
    `outputFormat="${escapeXmlAttribute(options.outputFormat)}" ` +
    'xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0">' +
    `<wfs:Query typeNames="${escapeXmlAttribute(typeName)}" srsName="${escapeXmlAttribute(
      options.requestProjectionCode,
    )}">` +
    filterXml +
    '</wfs:Query>' +
    '</wfs:GetFeature>'
  );
}

/**
 * Extracts the message from an OWS ExceptionReport, if the response is one. WFS servers may
 * return these with a non-200 status (observed against a live server) or, per the OWS spec,
 * with status 200 - checked independently of options.status for that reason.
 */
function extractOwsExceptionText(responseText: string): string | undefined {
  if (!responseText || !responseText.includes('ExceptionReport')) {
    return undefined;
  }
  const match = /<(?:\w+:)?ExceptionText>([\s\S]*?)<\/(?:\w+:)?ExceptionText>/i.exec(responseText);
  return match ? match[1].trim() : responseText.slice(0, 300);
}

export async function retrieveWfsFeature(options: IRetrieveWfsFeaturesOptions): Promise<Feature | undefined> {
  const allFeatures = await loadWfsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.featureProjection.getCode(),
    bbox: [],
    limit: 1,
    method: options.method ?? 'GET',
    version: options.version,
    outputFormat: options.outputFormat,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
    id: options.id,
  });

  let feature;
  if (allFeatures != null && allFeatures.length > 0) {
    feature = allFeatures[0];
  }
  return feature;
}

export async function loadWfsFeatureDescription(options: ILoadWfsFeatureDescriptionOptions): Promise<void> {
  const allFeatures = await loadWfsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.requestProjectionCode,
    bbox: [],
    limit: 1,
    method: options.method ?? 'GET',
    version: options.version,
    outputFormat: options.outputFormat,
  });

  let feature = null;
  if (allFeatures == null || allFeatures.length === 0) {
    console.warn('No features found for type ' + getQueryId<string>(options.type) + ' at url ' + options.url);
    return;
  }

  options.type.attributes = [];
  feature = allFeatures[0];
  const properties = feature.getProperties();
  Object.keys(properties).forEach((key) => {
    const attribute: IAttribute = {
      key,
      type: 'Unknown',
    };
    const value = properties[key];

    if (value != null) {
      if (typeof value === 'string') {
        attribute.type = 'String';
      } else if (typeof value === 'object') {
        try {
          // Try to instantiate geometry to check if it's a geometry attribute
          if (value instanceof Geometry) {
            attribute.type = 'Geometry';
            options.type.geometryAttribute = attribute;
          }
        } catch (e) {
          console.warn(`Attribute ${key} is of type object but could not be parsed as geometry.`);
        }
      }
    }
    options.type.attributes?.push(attribute);
  });
}

export async function loadDescribeFeatureType(options: ILoadWfsFeatureDescriptionOptions): Promise<boolean> {
  let success = false;
  const response = await HttpEngine.getInstance().send({
    method: 'GET',
    url: options.url,
    params: {
      service: 'WFS',
      version: options.version ?? DEFAULT_WFS_VERSION,
      request: 'DescribeFeatureType',
      typeNames: options.type.id,
    },
  });
  if (response.status === 200) {
    const wfsFeatureTypes = parseDescribeFeatureType(response.text || response.body);
    for (const featureType of wfsFeatureTypes) {
      if (featureType.id === options.type.id) {
        Object.assign(options.type, featureType);
        success = true;
        break;
      }
    }
  }
  return success;
}

function retrieveWfsFeaturesWithBBOXFromGeometry(options: IRetrieveWfsFeaturesWithGeometryOptions): Promise<Feature[]> {
  const extentRequested = options.geometry.getExtent();
  let extentTmp: Extent = [...extentRequested];
  if (options.queryType === 'identify') {
    const geoTolerance = options.identifyTolerance * options.mapResolution;
    extentTmp = [...calculateGeoExtent(extentRequested, geoTolerance)];
  }

  // Utilisation de l'étendue re-projetée comme étendue par défaut
  const extentFinal = transformExtent(extentTmp, options.geometryProjection, options.requestProjectionCode);

  return loadWfsFeaturesOnBBOX({
    cql: options.overrideFilters ? options.overrideFilters.toString(FilterBuilderTypeEnum.CQL) : undefined,
    filterFormat: options.filterFormat,
    filters: options.filters ?? undefined,
    overrideFilters: options.overrideFilters,
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.featureProjection.getCode(),
    bbox: extentFinal,
    limit: options.limit,
    method: options.method,
    version: options.version,
    outputFormat: options.outputFormat,
    swapXYBBOXRequest: options.swapXYBBOXRequest,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
  });
}

function retrieveWfsFeaturesWithoutGeometry(options: IRetrieveWfsFeaturesWithoutGeometryOptions): Promise<Feature[]> {
  return loadWfsFeaturesOnBBOX({
    cql: options.overrideFilters ? options.overrideFilters.toString(FilterBuilderTypeEnum.CQL) : undefined,
    filterFormat: options.filterFormat,
    filters: options.filters ?? undefined,
    overrideFilters: options.overrideFilters,
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.featureProjection.getCode(),
    bbox: [],
    limit: options.limit,
    method: options.method,
    version: options.version,
    outputFormat: options.outputFormat,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
  });
}

function wfsFeatureToQueryFeatureTypeResponseMapper(
  features: Feature[],
  type: IFeatureType<string>,
  source: IQuerySource,
): IQueryFeatureTypeResponse {
  return {
    type,
    features,
    source,
  };
}

/**
 * Transforme les options d'une requête WFS sans géométrie (IExecuteWfsQueryOptions)
 * en options compatibles avec la fonction retrieveWfsFeaturesWithoutGeometry (IRetrieveWfsFeaturesWithoutGeometryOptions)
 * @param options
 * @returns IRetrieveWfsFeaturesWithoutGeometryOptions
 */
function ewqoToRwfwogoTransformer(options: IExecuteWfsQueryOptions): IRetrieveWfsFeaturesWithoutGeometryOptions {
  return {
    // request: options.request,
    featureProjection: options.request.olMap.getView().getProjection(),
    filterFormat: options.filterFormat,
    filters: (options.request.filters as IPredicate) ?? undefined,
    limit: options.request.limit ?? DEFAULT_WFS_LIMIT,
    method: options.request.method ?? 'GET',
    outputFormat: options.outputFormat,
    overrideFilters: options.request.overrideFilters ?? undefined,
    requestProjectionCode: options.requestProjectionCode,
    swapXYBBOXRequest: options.swapXYBBOXRequest,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
    type: options.type,
    url: options.url,
    version: options.version ?? DEFAULT_WFS_VERSION,
  };
}

/**
 * Transforme les options d'une requête WFS avec géométrie (IExecuteWfsQueryOptions)
 * en options compatibles avec la fonction retrieveWfsFeaturesWithGeometry (IRetrieveWfsFeaturesWithGeometryOptions)
 * @param options
 * @returns IRetrieveWfsFeaturesWithGeometryOptions
 * @throws Error si la géométrie ou sa projection sont absentes dans les options de la requête
 */
function ewqoToRwfwgoTransformer(options: IExecuteWfsQueryOptions): IRetrieveWfsFeaturesWithGeometryOptions {
  if (options.request.geometry == null) {
    throw new Error('Geometry is required for retrieveWfsFeaturesWithGeometry');
  }
  if (options.request.geometryProjection == null) {
    throw new Error('Geometry projection is required for retrieveWfsFeaturesWithGeometry');
  }

  let identifyTolerance = DEFAULT_TOLERANCE;
  if (
    (options.request as IIdentifyRequest).identifyTolerance != null &&
    Math.round((options.request as IIdentifyRequest).identifyTolerance as number) > 0
  ) {
    identifyTolerance = (options.request as IIdentifyRequest).identifyTolerance as number;
  }

  // Sanitize options to be compatible with IRetrieveWfsFeaturesWithGeometryOptions
  return {
    featureProjection: options.request.olMap.getView().getProjection(),
    filterFormat: options.filterFormat,
    filters: (options.request.filters as IPredicate) ?? undefined,
    geometry: options.request.geometry.clone() as Geometry,
    geometryProjection: options.request.geometryProjection as Projection,
    identifyTolerance: identifyTolerance,
    limit: options.request.limit ?? DEFAULT_WFS_LIMIT,
    mapResolution: options.request.olMap.getView().getResolution() ?? DEFAULT_RESOLUTION,
    method: options.request.method ?? 'GET',
    outputFormat: options.outputFormat,
    overrideFilters: options.request.overrideFilters ?? undefined,
    queryType: options.request.queryType,
    requestProjectionCode: options.requestProjectionCode,
    swapXYBBOXRequest: options.swapXYBBOXRequest,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
    type: options.type,
    url: options.url,
    version: options.version as WfsVersion,
  };
}

function filterFeaturesByGeometry(features: Feature[], options: IRetrieveWfsFeaturesWithGeometryOptions): Feature[] {
  // Use request geometry in same projection as requested features
  let geometryUsedForDisjoint = options.geometry
    .clone()
    .transform(options.geometryProjection, options.featureProjection);

  // Case of identify from point with tolerance : apply buffer on point
  if (
    options.queryType === 'identify' &&
    options.identifyTolerance > 0 &&
    (options.geometry.getType() === 'Point' || options.geometry.getType() === 'MultiPoint')
  ) {
    const geoTolerance = options.identifyTolerance * options.mapResolution;
    const bufferedFeatureUsedForDisjoint = buffer(
      toGeoJSONFeature(new Feature<Geometry>(geometryUsedForDisjoint)),
      geoTolerance,
      options.featureProjection,
    );
    geometryUsedForDisjoint = toOpenLayersGeometry(bufferedFeatureUsedForDisjoint.geometry).clone();
  }

  return features.filter((feature) => {
    const featureGeom = feature.getGeometry();
    if (featureGeom) {
      // Si la géométrie de la feature intersecte la géométrie de la requête
      // Alors on ajoute la feature aux features à retourner
      return !disjoint(toGeoJSONGeometry(featureGeom), toGeoJSONGeometry(geometryUsedForDisjoint));
    }
    return false;
  });
}

function buildWfsRequestParams(options: ILoadWfsFeatureOptions): { [id: string]: string } {
  return {
    ...buildDefaultWfsRequestParams(options),
    ...buildBBOXParameter(options),
    ...buildCQLFilterParameter(options),
  };
}

function buildDefaultWfsRequestParams(options: ILoadWfsFeatureOptions): { [id: string]: string } {
  const params: { [id: string]: string } = {};
  params.SERVICE = 'WFS';
  params.VERSION = options.version;
  params.REQUEST = 'GetFeature';
  params.TYPENAME = getQueryId<string>(options.type);
  params.MAXFEATURES = `${options.limit}`;
  params.OUTPUTFORMAT = options.outputFormat;
  params.SRSNAME = options.requestProjectionCode;
  if (options.id != null) {
    params.FEATUREID = `${options.id}`; // GeoServer, BG, QGis Server
    // ?? // MapServer
    // ?? // ArcGIS WFS
  }

  return params;
}

/**
 * Formats options.bbox as "minx,miny,maxx,maxy,CRS" (optionally CRS-quoted, for embedding as a
 * string literal inside CQL), applying the swapXYBBOXRequest axis swap. Shared by the plain BBOX
 * KVP param, CQL_FILTER's BBOX(...) predicate and the OGC/FES BBOX predicate - byte-identical to
 * what each built inline before this was extracted.
 */
function buildBboxCoordinatesString(options: ILoadWfsFeatureOptions, quoteCrs: boolean): string {
  const crs = quoteCrs ? `'${options.requestProjectionCode}'` : options.requestProjectionCode;
  if (options.swapXYBBOXRequest === true) {
    return `${options.bbox[1]},${options.bbox[0]},${options.bbox[3]},${options.bbox[2]},${crs}`;
  }
  return `${options.bbox.join(',')},${crs}`;
}

function buildBBOXParameter(options: ILoadWfsFeatureOptions): { [id: string]: string } {
  const params: { [id: string]: string } = {};
  if (
    options.bbox != null &&
    options.bbox.length === 4 &&
    !(options.type?.predicate != null || options.cql != null || options.filters != null)
  ) {
    params.BBOX = buildBboxCoordinatesString(options, false);
  }
  return params;
}

function buildCQLFilterParameter(options: ILoadWfsFeatureOptions): { [id: string]: string } {
  const params: { [id: string]: string } = {};

  // Override params.CQL_FILTER if provided directly in options
  if (options.cql != null && options.cql !== '') {
    params.CQL_FILTER = options.cql;
    return params;
  }

  const filterBuilder = new FilterBuilder();

  if (options.filters) {
    filterBuilder.from(options.filters);
  }

  const predicate = options.type?.predicate;
  if (predicate != null) {
    filterBuilder.from(predicate);
  }

  if (filterBuilder.predicate) {
    if (options.bbox != null && options.bbox.length === 4) {
      const geometryName = options.type?.geometryAttribute?.key ?? 'the_geom';
      const bboxPredicate = new SpatialPre(
        { key: geometryName, type: FieldTypeEnum.Geometry },
        buildBboxCoordinatesString(options, true),
        SpatialPre.buildOperator(OperatorEnum.BBOX),
      );
      filterBuilder.and(bboxPredicate);
    }

    // Transformation de la predicate en CQL_FILTER
    params.CQL_FILTER = filterBuilder.build(FilterBuilderTypeEnum.CQL);
  }

  return params;
}

// ============================================================
// EXPORTS POUR LES TESTS UNITAIRES (à usage interne)
// ============================================================
export const __testing__ = {
  buildWfsRequestParams,
  buildBBOXParameter,
  buildCQLFilterParameter,
  buildOgcFilterPredicate,
  buildGetFeatureRequestXml,
  extractOwsExceptionText,
  loadWfsFeaturesWithOgcFilter: loadWfsFeaturesWithFesFilter,
};
