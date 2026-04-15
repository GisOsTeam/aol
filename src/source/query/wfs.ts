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
import { HttpEngine, IHttpResponse } from '../../HttpEngine';
import { FieldTypeEnum, FilterBuilder, FilterBuilderTypeEnum } from '../../filter';
import { IPredicate, SpatialPre } from '../../filter/predicate';
import { OperatorEnum } from '../../filter/operator';
import { DEFAULT_WFS_LIMIT, DEFAULT_WFS_VERSION, WfsVersion } from '../common';
import { parseDescribeFeatureType } from '../parser/wfs-describe-feature-type.parser';

export interface IExecuteWfsQueryOptions {
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

export interface ILoadWfsFeatureOptions {
  bbox: number[];
  cql?: string; // Override type predicate CQL if provided
  featureProjectionCode: string;
  filters?: IPredicate;
  id?: number | string;
  limit: number;
  outputFormat: string;
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
  outputFormat: string;
  requestProjectionCode: string;
}

export const DEFAULT_RESOLUTION = 1;
export const DEFAULT_TOLERANCE = 1;

interface IRetrieveWfsFeaturesDefaultOptions {
  featureProjection: Projection;
  filters: IPredicate;
  limit: number;
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

interface IRetrieveWfsFeaturesWithoutGeometryOptions extends IRetrieveWfsFeaturesDefaultOptions {}

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

export function loadWfsFeaturesOnBBOX(options: ILoadWfsFeatureOptions): Promise<Feature[]> {
  const params = buildWfsRequestParams(options);
  return HttpEngine.getInstance()
    .send({
      url: options.url,
      params,
      responseType: 'text',
    })
    .then(
      (res: IHttpResponse) => {
        if (res.status !== 200) {
          throw new Error('WFS BBOX request error ' + res.status);
        }
        const txt = res.text;
        return readFeatures(txt, options);
      },
      (err) => {
        console.error('WFS BBOX request failed:', err);
        throw err;
      },
    );
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
    const wfsFeatureTypes = parseDescribeFeatureType(response.text);
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
    filters: options.filters ?? undefined,
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.featureProjection.getCode(),
    bbox: extentFinal,
    limit: options.limit,
    version: options.version,
    outputFormat: options.outputFormat,
    swapXYBBOXRequest: options.swapXYBBOXRequest,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
  });
}

function retrieveWfsFeaturesWithoutGeometry(options: IRetrieveWfsFeaturesWithoutGeometryOptions): Promise<Feature[]> {
  return loadWfsFeaturesOnBBOX({
    cql: options.overrideFilters ? options.overrideFilters.toString(FilterBuilderTypeEnum.CQL) : undefined,
    filters: options.filters ?? undefined,
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.featureProjection.getCode(),
    bbox: [],
    limit: options.limit,
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
    filters: (options.request.filters as IPredicate) ?? undefined,
    limit: options.request.limit ?? DEFAULT_WFS_LIMIT,
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
    filters: (options.request.filters as IPredicate) ?? undefined,
    geometry: options.request.geometry.clone() as Geometry,
    geometryProjection: options.request.geometryProjection as Projection,
    identifyTolerance: identifyTolerance,
    limit: options.request.limit ?? DEFAULT_WFS_LIMIT,
    mapResolution: options.request.olMap.getView().getResolution() ?? DEFAULT_RESOLUTION,
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
  const geoTolerance = options.identifyTolerance * options.mapResolution;
  let geometryUsedForDisjoint = options.geometry.clone();

  if (options.queryType === 'identify') {
    const reprojected = options.geometry.clone().transform(options.geometryProjection, options.featureProjection);

    geometryUsedForDisjoint = toOpenLayersGeometry(
      buffer(toGeoJSONFeature(new Feature<Geometry>(reprojected.clone())), geoTolerance, options.featureProjection)
        .geometry,
    ).clone();
  }

  return features.filter((feature) => {
    const featureGeom = feature.getGeometry();
    if (featureGeom) {
      const filterableGeom = featureGeom.clone().transform(options.featureProjection, options.geometryProjection);
      // Si en mode identify et la géométrie source et de type point (ou multi point)
      // Ou si la géométrie de la feature intersecte la géométrie de la requête
      // Alors on ajoute la feature aux features à retourner
      return (
        (options.queryType === 'identify' &&
          (options.geometry.getType() === 'Point' || options.geometry.getType() === 'MultiPoint')) ||
        !disjoint(toGeoJSONGeometry(filterableGeom), toGeoJSONGeometry(geometryUsedForDisjoint))
      );
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

function buildBBOXParameter(options: ILoadWfsFeatureOptions): { [id: string]: string } {
  const params: { [id: string]: string } = {};
  if (
    options.bbox != null &&
    options.bbox.length === 4 &&
    !(options.type?.predicate != null || options.cql != null || options.filters != null)
  ) {
    if (options.swapXYBBOXRequest === true) {
      params.BBOX = `${options.bbox[1]},${options.bbox[0]},${options.bbox[3]},${options.bbox[2]},${options.requestProjectionCode}`;
    } else {
      params.BBOX = `${options.bbox.join(',')},${options.requestProjectionCode}`;
    }
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
      let bboxString: string;
      if (options.swapXYBBOXRequest === true) {
        bboxString = `${options.bbox[1]},${options.bbox[0]},${options.bbox[3]},${options.bbox[2]},'${options.requestProjectionCode}'`;
      } else {
        bboxString = `${options.bbox.join(',')},'${options.requestProjectionCode}'`;
      }
      const geometryName = options.type?.geometryAttribute?.key ?? 'the_geom';
      const bboxPredicate = new SpatialPre(
        { key: geometryName, type: FieldTypeEnum.Geometry },
        bboxString,
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
};
