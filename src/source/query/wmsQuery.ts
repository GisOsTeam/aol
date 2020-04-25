import Feature from 'ol/Feature';
import { get as getProjection, transformExtent } from 'ol/proj';
import WMSGetFeatureInfoFormat from 'ol/format/WMSGetFeatureInfo';
import { IQueryRequest, IFeatureType, IQueryFeatureTypeResponse, IExtended } from '../IExtended';
import { send, IResponse } from 'bhreq';
import { toGeoJSONGeometry, disjoint } from '../../utils';

export function wmsQueryOne(
  source: IExtended,
  type: IFeatureType<string>,
  request: IQueryRequest
): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, queryType, limit } = request;
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  const extent = transformExtent(geometry.getExtent(), geometryProjection, mapProjection);
  const params: { [id: string]: string | number } = {
    INFO_FORMAT: 'application/vnd.ogc.gml',
  };
  if (limit != null) {
    params.FEATURE_COUNT = limit;
  }
  const cql = ''; // TODO
  if (cql !== '') {
    params.CQL_FILTER = cql;
  }
  if (queryType === 'identify') {
    const tolerance = 2;
    params.BUFFER = tolerance;
    params.FI_POINT_TOLERANCE = tolerance;
    params.FI_LINE_TOLERANCE = tolerance;
    params.FI_POLYGON_TOLERANCE = tolerance;
  } else {
    const sld = `<StyledLayerDescriptor version="1.0.0"><UserLayer><Name>${type.id}</Name><UserStyle><FeatureTypeStyle><Rule><PointSymbolizer><Graphic><Mark><WellKnownName>square</WellKnownName><Fill><CssParameter name="fill">#FFFFFF</CssParameter></Fill></Mark><Size>3</Size></Graphic></PointSymbolizer><LineSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">3</CssParameter></Stroke></LineSymbolizer><PolygonSymbolizer><Stroke><CssParameter name="stroke">#000000</CssParameter><CssParameter name="stroke-width">3</CssParameter></Stroke></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></UserLayer></StyledLayerDescriptor>`;
    params.SLD_BODY = sld;
    params.BBOX = extent.join(',');
  }
  const url = (source as any).getFeatureInfoUrl(
    [0.5 * extent[0] + 0.5 * extent[2], 0.5 * extent[1] + 0.5 * extent[3]],
    olView.getResolution(),
    'EPSG:3857',
    params
  );
  return send({ url }).then((res: IResponse) => {
    const features = [] as Feature[];
    // Read features
    const allFeatures = new WMSGetFeatureInfoFormat().readFeatures(res.body, {
      dataProjection: 'EPSG:3857',
      featureProjection: mapProjection,
    });
    if (allFeatures && allFeatures.length > 0) {
      allFeatures.forEach((feature: Feature) => {
        if (limit == null || features.length < limit) {
          // Check intersection
          if (
            queryType === 'identify' ||
            feature.getGeometry() == null ||
            geometry.getType() === 'Point' ||
            geometry.getType() === 'MultiPoint' ||
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
