import Feature from 'ol/Feature';
import { get as getProjection, transformExtent } from 'ol/proj';
import WMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo';
import {
  IGisRequest,
  IFeatureType,
  IQueryFeatureTypeResponse,
  IExtended,
  IAttribute,
  IIdentifyRequest,
} from '../IExtended';
import { toGeoJSONGeometry, disjoint } from '../../utils';
import { getForViewAndSize } from 'ol/extent';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import Projection from 'ol/proj/Projection';
import Geometry from 'ol/geom/Geometry';
import { HttpEngine } from '../../HttpEngine';

const format = new WMSGetFeatureInfo();

function getFeatureInfoOnBBOX(
  source: IExtended,
  type: IFeatureType<string>,
  queryType: 'query' | 'identify',
  requestProjectionCode: string,
  featureProjectionCode: string,
  bbox: number[],
  renderSize: number,
  tolerance: number,
  limit: number,
  method: 'GET' | 'POST' = 'GET',
  gmlMimeType = 'application/vnd.ogc.gml',
  id?: number | string,
  cql?: string
): Promise<Feature[]> {
  let url = '';
  if ('getUrl' in source) {
    url = (source as any).getUrl();
  } else if ('getUrls' in source) {
    url = (source as any).getUrls()[0];
  }
  const params: { [id: string]: string } = {};
  params.SERVICE = 'WMS';
  params.VERSION = '1.3.0';
  params.REQUEST = 'GetFeatureInfo';
  params.QUERY_LAYERS = type.id;
  params.LAYERS = type.id;
  params.INFO_FORMAT = gmlMimeType;
  params.SRS = requestProjectionCode;
  params.I = `${Math.round(renderSize / 2)}`;
  params.J = `${Math.round(renderSize / 2)}`;
  params.WIDTH = `${renderSize}`;
  params.HEIGHT = `${renderSize}`;
  params.BBOX = bbox.join(',');
  params.FEATURE_COUNT = `${limit}`;
  if (id != null) {
    params.FEATUREID = `${id}`; // GeoServer
    // ?? // QGis Server
    // ?? // MapServer
    // ?? // ArcGIS WMS
  }
  const toleranceStr = `${tolerance}`;
  params.BUFFER = toleranceStr; // GeoServer
  params.RADIUS = toleranceStr; // MapServer
  params.FI_POINT_TOLERANCE = toleranceStr; // QGis Server
  params.FI_LINE_TOLERANCE = toleranceStr; // QGis Server
  params.FI_POLYGON_TOLERANCE = toleranceStr; // QGis Server
  params.WITH_GEOMETRY = 'true'; // QGis Server
  if (cql != null && cql !== '') {
    params.CQL_FILTER = cql;
  }
  if (queryType === 'query') {
    params.SLD_BODY = `<StyledLayerDescriptor version="1.0.0"><UserLayer><Name>${type.id}</Name><UserStyle><FeatureTypeStyle><Rule><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Fill><CssParameter name="fill">#FFFFFF</CssParameter></Fill></Mark><Size>1</Size></Graphic></PointSymbolizer><LineSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke></LineSymbolizer><PolygonSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">1</CssParameter></Stroke></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></UserLayer></StyledLayerDescriptor>`;
  }

  const httpEngine = HttpEngine.getInstance();
  let promise = null;
  if (method === 'POST') {
    promise = httpEngine.send({
      url,
      body: params,
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      responseType: 'text',
    });
  } else {
    promise = httpEngine.send({
      url: url,
      params,
      responseType: 'text',
    });
  }
  return promise.then(
    (res) => {
      // Read features
      const features = [] as Feature[];
      // Search projection on results
      let dataProjection = getProjection(requestProjectionCode);
      let dataProjectionCode = requestProjectionCode;
      const res1 = res.body.match(/\ssrsName=\"([^\"]+)\"/i);
      if (res1 && res1.length >= 2) {
        const res2 = res1[1].match(/(\d+)(?!.*\d)/g);
        if (res2 && res2.length > 0) {
          dataProjectionCode = 'EPSG:' + res2[res2.length - 1];
        }
      }
      try {
        dataProjection = getProjection(dataProjectionCode);
      } catch (err) {
        console.error(err);
      }
      // Hack for GeoServer with space in name
      let txt = res.text;
      if (/\s/.test(type.id)) {
        const withoutSpace = type.id.replace(/\s/g, '_');
        const withSpace = type.id.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
        txt = txt.replace(new RegExp('<' + withSpace, 'g'), '<' + withoutSpace);
        txt = txt.replace(new RegExp('</' + withSpace, 'g'), '</' + withoutSpace);
      }
      // Read features
      const allFeatures = format.readFeatures(txt);
      if (allFeatures != null && allFeatures.length > 0) {
        allFeatures.forEach((feature: Feature) => {
          if (limit == null || features.length < limit) {
            if (dataProjection.getUnits() === 'degrees') {
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
              feature.getGeometry().transform(dataProjection, featureProjectionCode);
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

export function executeWmsQuery(
  source: IExtended,
  type: IFeatureType<string>,
  request: IGisRequest,
  method: 'GET' | 'POST' = 'GET',
  gmlMimeType = 'application/vnd.ogc.gml'
): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, queryType, limit } = request;
  const requestProjectionCode = 'EPSG:3857';
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  const extent = transformExtent(geometry.getExtent(), geometryProjection, requestProjectionCode);
  const mapExtent = getForViewAndSize(
    [0.5 * extent[0] + 0.5 * extent[2], 0.5 * extent[1] + 0.5 * extent[3]],
    olView.getResolution(),
    0,
    [1001, 1001]
  );
  let tolerance;
  switch (queryType) {
    case 'identify':
      const { identifyTolerance } = request as IIdentifyRequest;
      if (Math.round(identifyTolerance) > 0) {
        tolerance = Math.round(identifyTolerance);
      } else {
        tolerance = 4;
      }
      break;
    case 'query':
      const mapH = Math.sqrt(
        (mapExtent[2] - mapExtent[0]) * (mapExtent[2] - mapExtent[0]) + (mapExtent[3] - mapExtent[1])
      );
      const geomH = Math.sqrt(
        (extent[2] - extent[0]) * (extent[2] - extent[0]) + (extent[3] - extent[1]) * (extent[3] - extent[1])
      );
      tolerance = 1 + Math.round((500 * geomH) / mapH);
      break;
  }

  return getFeatureInfoOnBBOX(
    source,
    type,
    queryType,
    requestProjectionCode,
    mapProjection.getCode(),
    mapExtent,
    1001,
    tolerance,
    limit ? 2 * limit : 100000,
    method,
    gmlMimeType
  ).then((allFeatures) => {
    const features = [] as Feature[];
    if (allFeatures && allFeatures.length > 0) {
      allFeatures.forEach((feature: Feature) => {
        // Check intersection
        if (
          feature.getGeometry() == null ||
          (queryType === 'identify' && (geometry.getType() === 'Point' || geometry.getType() === 'MultiPoint')) ||
          !disjoint(toGeoJSONGeometry(feature.getGeometry()), toGeoJSONGeometry(geometry))
        ) {
          features.push(feature);
        }
      });
    }
    return {
      type,
      features,
      source,
    };
  });
}

export function retrieveWmsFeature(
  source: IExtended,
  type: IFeatureType<string>,
  id: number | string,
  featureProjection: Projection,
  method: 'GET' | 'POST' = 'GET',
  gmlMimeType = 'application/vnd.ogc.gml'
): Promise<Feature> {
  const requestProjectionCode = 'EPSG:3857';
  const mapExtent = [-20026376.39, -20048966.1, 20026376.39, 20048966.1];
  return getFeatureInfoOnBBOX(
    source,
    type,
    'query',
    requestProjectionCode,
    featureProjection.getCode(),
    mapExtent,
    1001,
    500,
    1,
    method,
    gmlMimeType,
    id
  ).then((allFeatures) => {
    let feature = null;
    if (allFeatures != null && allFeatures.length > 0) {
      feature = allFeatures[0];
    }
    return feature;
  });
}

export function loadWmsFeatureDescription(
  source: IExtended,
  type: IFeatureType<string>,
  method: 'GET' | 'POST' = 'GET',
  gmlMimeType = 'application/vnd.ogc.gml'
): Promise<void> {
  const requestProjectionCode = 'EPSG:3857';
  const mapExtent = [-20026376.39, -20048966.1, 20026376.39, 20048966.1];
  return getFeatureInfoOnBBOX(
    source,
    type,
    'query',
    requestProjectionCode,
    requestProjectionCode,
    mapExtent,
    3,
    3,
    1,
    method,
    gmlMimeType
  ).then((allFeatures) => {
    let feature = null;
    if (allFeatures != null && allFeatures.length > 0) {
      type.attributes = [];
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
        type.attributes.push(attribute);
      });
      return;
    }
  });
}
