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
import { Extent, getCenter, getForViewAndSize } from 'ol/extent';
import Projection from 'ol/proj/Projection';
import Geometry from 'ol/geom/Geometry';
import { Engine } from 'bhreq';
import { readFeatures } from '../../utils/featuresRead';
import { calculateGeoExtent } from '../../utils/extent';
import { DEFAULT_TOLERANCE } from './wfs';

function loadWmsFeaturesOnBBOX(options: {
  url: string;
  type: IFeatureType<string>;
  queryType: 'query' | 'identify';
  requestProjectionCode: string;
  featureProjectionCode: string;
  bbox: Extent;
  renderSize: number;
  tolerance: number;
  limit: number;
  method: 'GET' | 'POST';
  version: '1.0.0' | '1.1.0' | '1.3.0';
  outputFormat: string;
  swapXYBBOXRequest?: boolean;
  swapLonLatGeometryResult?: boolean;
  id?: number | string;
  cql?: string;
}): Promise<Feature[]> {
  const params: { [id: string]: string } = {};
  params.SERVICE = 'WMS';
  params.VERSION = options.version;
  params.REQUEST = 'GetFeatureInfo';
  params.QUERY_LAYERS = getQueryId<string>(options.type);
  params.LAYERS = getQueryId<string>(options.type);
  params.INFO_FORMAT = options.outputFormat;
  if (options.version === '1.3.0') {
    params.CRS = options.requestProjectionCode;
    params.I = `${Math.round(options.renderSize / 2)}`;
    params.J = `${Math.round(options.renderSize / 2)}`;
  } else {
    params.SRS = options.requestProjectionCode;
    params.X = `${Math.round(options.renderSize / 2)}`;
    params.Y = `${Math.round(options.renderSize / 2)}`;
  }
  params.WIDTH = `${options.renderSize}`;
  params.HEIGHT = `${options.renderSize}`;
  if (options.bbox != null && options.bbox.length === 4) {
    if (options.swapXYBBOXRequest !== true) {
      params.BBOX = options.bbox.join(',');
    } else {
      params.BBOX += `${options.bbox[1]},${options.bbox[0]},${options.bbox[3]},${options.bbox[2]}`;
    }
  }
  params.FEATURE_COUNT = `${options.limit}`;
  if (options.id != null) {
    params.FEATUREID = `${options.id}`; // GeoServer, BG, QGis Server
    // ?? // MapServer
    // ?? // ArcGIS WMS
  }
  const toleranceStr = `${options.tolerance}`;
  params.BUFFER = toleranceStr; // GeoServer
  params.RADIUS = toleranceStr; // MapServer
  params.FI_POINT_TOLERANCE = toleranceStr; // QGis Server
  params.FI_LINE_TOLERANCE = toleranceStr; // QGis Server
  params.FI_POLYGON_TOLERANCE = toleranceStr; // QGis Server
  params.WITH_GEOMETRY = 'true'; // QGis Server
  if (options.cql != null && options.cql !== '') {
    params.CQL_FILTER = options.cql;
  }
  if (options.queryType === 'query') {
    params.SLD_BODY = `<StyledLayerDescriptor version="1.0.0"><UserLayer><Name>${getQueryId<string>(
      options.type
    )}</Name><UserStyle><FeatureTypeStyle><Rule><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Fill><CssParameter name="fill">#FFFFFF</CssParameter></Fill></Mark><Size>1</Size></Graphic></PointSymbolizer><LineSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke></LineSymbolizer><PolygonSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></UserLayer></StyledLayerDescriptor>`;
  }
  params.FORMAT = 'image/png';
  params.STYLES = '';

  let promise = null;
  if (options.method == 'POST') {
    promise = Engine.getInstance().send({
      url: options.url,
      body: params,
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      responseType: 'text',
    });
  } else {
    promise = Engine.getInstance().send({
      url: options.url,
      params,
      responseType: 'text',
    });
  }
  return promise.then(
    (res) => {
      if (res.status !== 200) {
        throw new Error('WMS request error ' + res.status);
      }
      return readFeatures(res.text, options);
    },
    (err) => {
      console.error('Get WMS feature info in error');
      return err;
    }
  );
}

export function executeWmsQuery(options: {
  source: IQuerySource;
  url: string;
  type: IFeatureType<string>;
  request: IGisRequest;
  requestProjectionCode: string;
  method: 'GET' | 'POST';
  version: '1.0.0' | '1.1.0' | '1.3.0';
  outputFormat: string;
  swapXYBBOXRequest: boolean;
  swapLonLatGeometryResult: boolean;
}): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, queryType, limit } = options.request;
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  const extentOriginal: Extent = [...geometry.getExtent()];
  let extentUsed: Extent = [...extentOriginal];
  // Géométrie utilisée pour vérifier que les features resultant de la requête ne sont pas disjoint
  let geometryUsedForDisjoint = geometry.clone();

  // tolérance utilisée
  let tolerance = DEFAULT_TOLERANCE;

  // Assignation de la résolution
  const resolution = olView.getResolution() == null ? 1 : olView.getResolution();

  // Assignation de la tolérance à appliquer
  const geoTolerance = tolerance * resolution;

  switch (queryType) {
    case 'query':
      tolerance = 1;
      // Utilisation de l'étendue intégrant la tolérance comme étendue par défaut
      extentUsed = [...calculateGeoExtent(extentOriginal, geoTolerance)];
      break;
    case 'identify':
      const { identifyTolerance } = options.request as IIdentifyRequest;
      if (Math.round(identifyTolerance) > 0) {
        tolerance = identifyTolerance;
      }
      // Utilisation de l'étendue centrée sur la géometry
      const center = getCenter(geometry.getExtent());
      extentUsed = getForViewAndSize(center, resolution, 0, [1001, 1001]);
      break;
  }

  geometryUsedForDisjoint = toOpenLayersGeometry(
    buffer(toGeoJSONFeature(new Feature<Geometry>(geometry.clone())), geoTolerance, geometryProjection).geometry
  );

  // Utilisation de l'étendue re-projetée comme étendue par défaut
  extentUsed = transformExtent(extentUsed, geometryProjection, options.requestProjectionCode);

  return loadWmsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType,
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: mapProjection.getCode(),
    bbox: extentUsed,
    renderSize: 1001,
    tolerance,
    limit: limit ? 2 * limit : 100000,
    method: options.method,
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

export function retrieveWmsFeature(options: {
  url: string;
  type: IFeatureType<string>;
  id: number | string;
  requestProjectionCode: string;
  featureProjection: Projection;
  method: 'GET' | 'POST';
  version: '1.0.0' | '1.1.0' | '1.3.0';
  outputFormat: string;
  swapLonLatGeometryResult?: boolean;
}): Promise<Feature> {
  const mapExtent: Extent = [-20026376.39, -20048966.1, 20026376.39, 20048966.1];
  return loadWmsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.featureProjection.getCode(),
    bbox: mapExtent,
    renderSize: 1001,
    limit: 1,
    tolerance: 500,
    method: options.method,
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

export function loadWmsFeatureDescription(options: {
  url: string;
  type: IFeatureType<string>;
  requestProjectionCode: string;
  method: 'GET' | 'POST';
  version: '1.0.0' | '1.1.0' | '1.3.0';
  outputFormat: string;
}): Promise<void> {
  const mapExtent: Extent = [-20026376.39, -20048966.1, 20026376.39, 20048966.1];
  return loadWmsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.requestProjectionCode,
    bbox: mapExtent,
    renderSize: 3,
    tolerance: 3,
    limit: 1,
    method: options.method,
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
