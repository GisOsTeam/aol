import Feature from 'ol/Feature';
import { get as getProjection, transformExtent } from 'ol/proj';
import WMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo';
import {
  IGisRequest,
  IFeatureType,
  IQueryFeatureTypeResponse,
  IAttribute,
  IIdentifyRequest,
  IQuerySource,
} from '../IExtended';
import { toGeoJSONGeometry, disjoint, getQueryId } from '../../utils';
import { getForViewAndSize } from 'ol/extent';
import Projection from 'ol/proj/Projection';
import Geometry from 'ol/geom/Geometry';
import { Engine } from 'bhreq';
import SimpleGeometry from 'ol/geom/SimpleGeometry';

function loadWmsFeaturesOnBBOX(options: {
  url: string;
  type: IFeatureType<string>;
  queryType: 'query' | 'identify';
  requestProjectionCode: string;
  featureProjectionCode: string;
  bbox: number[];
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
  if (options.method === 'POST') {
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
      const features = [] as Feature[];
      let txt = res.text;
      // Search projection on results
      let dataProjection = getProjection(options.requestProjectionCode);
      let dataProjectionCode = options.requestProjectionCode;
      const res1 = txt.match(/\ssrsName=\"([^\"]+)\"/i);
      if (res1 && res1.length >= 2) {
        const res2 = res1[1].match(/(\d+)(?!.*\d)/g);
        if (res2 && res2.length > 0) {
          dataProjectionCode = 'EPSG:' + res2[res2.length - 1];
          txt = txt.replace(/\ssrsName=\"([^\"]+)\"/i, ` srsName="${dataProjectionCode}"`);
        }
      }
      try {
        dataProjection = getProjection(dataProjectionCode);
      } catch (err) {
        console.error(err);
      }
      // Hack for GeoServer with space in name
      if (/\s/.test(getQueryId<string>(options.type))) {
        const withoutSpace = getQueryId<string>(options.type).replace(/\s/g, '_');
        const withSpace = getQueryId<string>(options.type).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
        txt = txt.replace(new RegExp('<' + withSpace, 'g'), '<' + withoutSpace);
        txt = txt.replace(new RegExp('</' + withSpace, 'g'), '</' + withoutSpace);
      }
      // Read features
      const allFeatures = new WMSGetFeatureInfo().readFeatures(txt);
      if (allFeatures != null && allFeatures.length > 0) {
        allFeatures.forEach((feature: Feature) => {
          if (options.limit == null || features.length < options.limit) {
            if (options.swapLonLatGeometryResult === true && dataProjection.getUnits() === 'degrees') {
              if (feature.getGeometry()) {
                // In degree: This formats the geographic coordinates in longitude/latitude (x/y) order.
                // Reverse coordinates !
                (feature.getGeometry() as SimpleGeometry).applyTransform(
                  (input: number[], ouput: number[], dimension: number) => {
                    for (let i = 0; i < input.length; i += dimension) {
                      const y = input[i];
                      const x = input[i + 1];
                      ouput[i] = x;
                      ouput[i + 1] = y;
                    }
                    return ouput;
                  }
                );
              }
            }
            if (feature.getGeometry()) {
              feature.getGeometry().transform(dataProjection, options.featureProjectionCode);
            }
            features.push(feature);
          }
        });
      }
      return features;
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
  const extent = transformExtent(geometry.getExtent(), geometryProjection, options.requestProjectionCode);
  const mapExtent = getForViewAndSize(
    [0.5 * extent[0] + 0.5 * extent[2], 0.5 * extent[1] + 0.5 * extent[3]],
    olView.getResolution(),
    0,
    [1001, 1001]
  );
  let tolerance;
  switch (queryType) {
    case 'identify':
      const { identifyTolerance } = options.request as IIdentifyRequest;
      if (Math.round(identifyTolerance) > 0) {
        tolerance = Math.round(identifyTolerance);
      } else {
        tolerance = 4;
      }
      break;
    case 'query':
      tolerance = 1;
      break;
  }
  if (geometry.getType() !== 'Point') {
    const mapH = Math.sqrt(
      (mapExtent[2] - mapExtent[0]) * (mapExtent[2] - mapExtent[0]) + (mapExtent[3] - mapExtent[1])
    );
    const geomH = Math.sqrt(
      (extent[2] - extent[0]) * (extent[2] - extent[0]) + (extent[3] - extent[1]) * (extent[3] - extent[1])
    );
    tolerance += Math.round((500 * geomH) / mapH);
  }

  return loadWmsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType,
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: mapProjection.getCode(),
    bbox: mapExtent,
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
          const geom = feature.getGeometry().clone();
          geom.transform(mapProjection, geometryProjection);
          if (
            (queryType === 'identify' && (geometry.getType() === 'Point' || geometry.getType() === 'MultiPoint')) ||
            !disjoint(toGeoJSONGeometry(geom), toGeoJSONGeometry(geometry))
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
  const mapExtent = [-20026376.39, -20048966.1, 20026376.39, 20048966.1];
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
  const mapExtent = [-20026376.39, -20048966.1, 20026376.39, 20048966.1];
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
          } else if (typeof value === 'object' && value instanceof Geometry) {
            attribute.type = 'Geometry';
          }
        }
        options.type.attributes.push(attribute);
      });
    }
  });
}
