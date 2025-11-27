import Feature from 'ol/Feature';
import { transformExtent } from 'ol/proj';
import {
  IAttribute,
  IFeatureType,
  IGisRequest,
  IIdentifyRequest,
  IQueryFeatureTypeResponse,
  IQuerySource,
} from '../IExtended';
import { buffer, disjoint, getQueryId, toGeoJSONFeature, toGeoJSONGeometry, toOpenLayersGeometry } from '../../utils';
import { Extent } from 'ol/extent';
import Geometry from 'ol/geom/Geometry';
import Projection from 'ol/proj/Projection';
import { readFeatures } from '../../utils/featuresRead';
import { calculateGeoExtent } from '../../utils/extent';
import { HttpEngine, IHttpResponse } from '../../HttpEngine';
import { FilterBuilderTypeEnum } from '../../filter';

export const DEFAULT_TOLERANCE = 4;

export function loadWfsFeaturesOnBBOX(options: {
  url: string;
  type: IFeatureType<string>;
  queryType: 'query' | 'identify';
  requestProjectionCode: string;
  featureProjectionCode: string;
  bbox: number[];
  limit: number;
  version: '1.0.0' | '1.1.0' | '2.0.0';
  outputFormat: string;
  swapXYBBOXRequest?: boolean;
  swapLonLatGeometryResult?: boolean;
  id?: number | string;
  cql?: string; // Override type predicate CQL if provided
}): Promise<Feature[]> {
  const params: { [id: string]: string } = {};
  params.SERVICE = 'WFS';
  params.VERSION = options.version;
  params.REQUEST = 'GetFeature';
  params.TYPENAME = getQueryId<string>(options.type);
  params.MAXFEATURES = `${options.limit}`;
  params.OUTPUTFORMAT = options.outputFormat;
  params.SRSNAME = options.requestProjectionCode;
  if (options.bbox != null && options.bbox.length === 4) {
    if (options.swapXYBBOXRequest !== true) {
      params.BBOX = `${options.bbox.join(',')},${options.requestProjectionCode}`;
    } else {
      params.BBOX += `${options.bbox[1]},${options.bbox[0]},${options.bbox[3]},${options.bbox[2]},${options.requestProjectionCode}`;
    }
  }
  if (options.id != null) {
    params.FEATUREID = `${options.id}`; // GeoServer, BG, QGis Server
    // ?? // MapServer
    // ?? // ArcGIS WFS
  }

  if (options.type?.predicate != null) {
    params.CQL_FILTER = options.type.predicate.toString(FilterBuilderTypeEnum.CQL);
  }

  // Override params.CQL_FILTER if provided directly in options
  if (options.cql != null && options.cql !== '') {
    params.CQL_FILTER = options.cql;
  }

  return HttpEngine.getInstance()
    .send({
      url: options.url,
      params,
      responseType: 'text',
    })
    .then(
      (res: IHttpResponse) => {
        if (res.status !== 200) {
          throw new Error('WFS request error ' + res.status);
        }
        const txt = res.text;
        return readFeatures(txt, options);
      },
      (err) => {
        console.error('Get WMS feature info in error');
        return err;
      },
    );
}

export function executeWfsQuery(options: {
  source: IQuerySource;
  url: string;
  type: IFeatureType<string>;
  request: IGisRequest;
  requestProjectionCode: string;
  version: '1.0.0' | '1.1.0' | '2.0.0';
  outputFormat: string;
  swapXYBBOXRequest: boolean;
  swapLonLatGeometryResult: boolean;
}): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, queryType, limit } = options.request;
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  const extentOriginal = geometry.getExtent();
  let extentUsed: Extent = [...extentOriginal];
  // Géométrie utilisée pour vérifier que les features resultant de la requête ne sont pas disjoint
  let geometryUsedForDisjoint = geometry.clone();
  if (queryType === 'identify') {
    const { identifyTolerance } = options.request as IIdentifyRequest;
    // Assignation de la résolution
    const resolution = olView.getResolution() == null ? 1 : olView.getResolution();
    // Assignation de la tolérance à appliquer
    const geoTolerance = (Math.round(identifyTolerance) > 0 ? identifyTolerance : DEFAULT_TOLERANCE) * resolution;
    // Utilisation de l'étendue intégrant la tolérance comme étendue par défaut
    extentUsed = [...calculateGeoExtent(extentOriginal, geoTolerance)];

    geometryUsedForDisjoint = toOpenLayersGeometry(
      buffer(toGeoJSONFeature(new Feature<Geometry>(geometry.clone())), geoTolerance, geometryProjection).geometry,
    );
  }

  // Utilisation de l'étendue re-projetée comme étendue par défaut
  extentUsed = transformExtent(extentUsed, geometryProjection, options.requestProjectionCode);
  return loadWfsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: mapProjection.getCode(),
    bbox: extentUsed,
    limit,
    version: options.version,
    outputFormat: options.outputFormat,
    swapXYBBOXRequest: options.swapXYBBOXRequest,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
  }).then((allFeatures) => {
    const features = [] as Feature[];
    if (allFeatures && allFeatures.length > 0) {
      allFeatures.forEach((feature: Feature) => {
        // Check intersection
        if (feature.getGeometry() != null) {
          // Duplication de la géométrie de la feature courante et transformation vers la projection de la géométrie
          // source
          const geom = feature.getGeometry().clone().transform(mapProjection, geometryProjection);
          // Si en mode identify et la géométrie source et de type point (ou multi point)
          // Ou si la géométrie de la feature intersecte la géométrie de la requête
          // Alors on ajoute la feature aux features à retourner
          if (
            (queryType === 'identify' && (geometry.getType() === 'Point' || geometry.getType() === 'MultiPoint')) ||
            !disjoint(toGeoJSONGeometry(geom), toGeoJSONGeometry(geometryUsedForDisjoint))
          ) {
            features.push(feature);
          }
        } else {
          features.push(feature);
        }
      });
    }
    return {
      type: options.type,
      features,
      source: options.source,
    };
  });
}

export function retrieveWfsFeature(options: {
  url: string;
  type: IFeatureType<string>;
  id: number | string;
  requestProjectionCode: string;
  featureProjection: Projection;
  version: '1.0.0' | '1.1.0' | '2.0.0';
  outputFormat: string;
  swapXYBBOXRequest: boolean;
  swapLonLatGeometryResult: boolean;
}): Promise<Feature> {
  return loadWfsFeaturesOnBBOX({
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
  }).then((allFeatures) => {
    let feature = null;
    if (allFeatures != null && allFeatures.length > 0) {
      feature = allFeatures[0];
    }
    return feature;
  });
}

export function loadWfsFeatureDescription(options: {
  url: string;
  type: IFeatureType<string>;
  version: '1.0.0' | '1.1.0' | '2.0.0';
  outputFormat: string;
  requestProjectionCode: string;
}): Promise<void> {
  return loadWfsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.requestProjectionCode,
    bbox: [],
    limit: 1,
    version: options.version,
    outputFormat: options.outputFormat,
  }).then((allFeatures) => {
    let feature = null;
    if (allFeatures != null && allFeatures.length > 0) {
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
            attribute.type = 'Geometry';
          }
        }
        options.type.attributes.push(attribute);
      });
    }
  });
}
