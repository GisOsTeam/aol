import Feature from 'ol/Feature';
import { transformExtent } from 'ol/proj';
import EsriJSON from 'ol/format/EsriJSON';
import { IQueryRequest, IFeatureType, IQueryFeatureTypeResponse, IExtended } from '../IExtended';
import { send, IResponse } from 'bhreq';
import { toGeoJSONGeometry, disjoint } from '../../utils';
import { getForViewAndSize } from 'ol/extent';

export function agsQueryOne(
  source: IExtended,
  type: IFeatureType<number>,
  request: IQueryRequest
): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, queryType, limit } = request;
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  const extent = transformExtent(geometry.getExtent(), geometryProjection, mapProjection);
  if (extent[0] > extent[2]) {
    const val = extent[0];
    extent[0] = extent[2];
    extent[2] = val;
  }
  if (extent[1] > extent[3]) {
    const val = extent[1];
    extent[1] = extent[3];
    extent[3] = val;
  }
  const serviceUrl = (source as any).getUrl();
  const envelope = extent.join(',');
  const sr = mapProjection.getCode().split(':', 2)[1];
  let url;
  if (queryType === 'identify') {
    const layers = `all:${type.id}`;
    const mapExtent = getForViewAndSize(
      [0.5 * extent[0] + 0.5 * extent[2], 0.5 * extent[1] + 0.5 * extent[3]],
      olView.getResolution(),
      0,
      [101, 101]
    );
    const imageDisplay = [101, 101];
    const tolerance = 2;
    url = `${serviceUrl}/identify?mapExtent=${mapExtent}&imageDisplay=${imageDisplay}&layers=${layers}&geometry=${envelope}&geometryType=esriGeometryEnvelope&sr=${sr}&tolerance=${tolerance}&returnGeometry=true&f=json`;
  } else {
    const where = ''; // TODO
    url = `${serviceUrl}/${type.id}/query?geometry=${envelope}&geometryType=esriGeometryEnvelope&inSR=${sr}&outSR=${sr}&where=${where}&returnGeometry=true&f=json`;
  }
  return send({ url }).then((res: IResponse) => {
    const features = [] as Feature[];
    // Read features
    const jsonQueryRes = res.body;
    const format = new EsriJSON();
    if (jsonQueryRes != null) {
      const jsonFeatures = jsonQueryRes.features || jsonQueryRes.results;
      if (jsonFeatures != null && jsonFeatures.length > 0) {
        jsonFeatures.forEach((jsonFeature: any) => {
          if (limit == null || features.length < limit) {
            const feature = format.readFeature(jsonFeature) as Feature;
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
    }
    return Promise.resolve({
      type,
      features,
      source,
    });
  });
}
