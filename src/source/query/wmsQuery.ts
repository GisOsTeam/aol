import Feature from 'ol/Feature';
import { get as getProjection, transformExtent } from 'ol/proj';
import WMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo';
import { IQueryRequest, IFeatureType, IQueryFeatureTypeResponse, IExtended } from '../IExtended';
import { send, IResponse } from 'bhreq';
import { toGeoJSONGeometry, disjoint } from '../../utils';
import { getForViewAndSize } from 'ol/extent';
import SimpleGeometry from 'ol/geom/SimpleGeometry';

const format = new WMSGetFeatureInfo();

export function wmsQueryOne(
  source: IExtended,
  type: IFeatureType<string>,
  request: IQueryRequest
): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, queryType, limit } = request;
  const requestProjectionCode = 'EPSG:3857';
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  const extent = transformExtent(geometry.getExtent(), geometryProjection, requestProjectionCode);
  let url = '';
  if ('getUrl' in source) {
    url = (source as any).getUrl();
  } else if ('getUrls' in source) {
    url = (source as any).getUrls()[0];
  }
  const body: { [id: string]: string } = {};
  body.SERVICE = 'WMS';
  body.VERSION = '1.1.0';
  body.REQUEST = 'GetFeatureInfo';
  body.QUERY_LAYERS = type.id;
  body.LAYERS = type.id;
  body.INFO_FORMAT = 'application/vnd.ogc.gml';
  body.SRS = requestProjectionCode;
  const mapExtent = getForViewAndSize(
    [0.5 * extent[0] + 0.5 * extent[2], 0.5 * extent[1] + 0.5 * extent[3]],
    olView.getResolution(),
    0,
    [1001, 1001]
  );
  body.X = '500';
  body.Y = '500';
  body.WIDTH = '1001';
  body.HEIGHT = '1001';
  body.BBOX = mapExtent.join(',');
  body.FEATURE_COUNT = (limit ? 2 * limit : 100000).toString();
  const mapH = Math.sqrt((mapExtent[2] - mapExtent[0]) * (mapExtent[2] - mapExtent[0]) + (mapExtent[3] - mapExtent[1]));
  const geomH = Math.sqrt(
    (extent[2] - extent[0]) * (extent[2] - extent[0]) + (extent[3] - extent[1]) * (extent[3] - extent[1])
  );
  let tolerance = 1 + Math.round((500 * geomH) / mapH);
  if (queryType === 'identify') {
    tolerance++;
  }
  const toleranceStr = tolerance.toString();
  body.BUFFER = toleranceStr;
  body.RADIUS = toleranceStr;
  body.FI_POINT_TOLERANCE = toleranceStr;
  body.FI_LINE_TOLERANCE = toleranceStr;
  body.FI_POLYGON_TOLERANCE = toleranceStr;
  if (queryType === 'query') {
    body.SLD_BODY = `<StyledLayerDescriptor version="1.0.0"><UserLayer><Name>${type.id}</Name><UserStyle><FeatureTypeStyle><Rule><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Fill><CssParameter name="fill">#FFFFFF</CssParameter></Fill></Mark><Size>3</Size></Graphic></PointSymbolizer><LineSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">3</CssParameter></Stroke></LineSymbolizer><PolygonSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">3</CssParameter></Stroke></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></UserLayer></StyledLayerDescriptor>`;
    const cql = ''; // TODO
    if (cql !== '') {
      body.CQL_FILTER = cql;
    }
  }
  return send({
    url,
    body,
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    responseType: 'text/plain',
  }).then((res: IResponse) => {
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
    // Read features
    const allFeatures = format.readFeatures(res.body);
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
            feature.getGeometry().transform(dataProjection, mapProjection);
          }
          // Check intersection
          if (
            feature.getGeometry() == null ||
            (queryType === 'identify' && (geometry.getType() === 'Point' || geometry.getType() === 'MultiPoint')) ||
            !disjoint(toGeoJSONGeometry(feature.getGeometry()), toGeoJSONGeometry(geometry))
          ) {
            features.push(feature);
          }
        }
      });
    }
    return Promise.resolve({
      type,
      features,
      source,
    });
  });
}
