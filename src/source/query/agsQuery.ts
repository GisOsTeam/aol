import Feature from 'ol/Feature';
import { transformExtent } from 'ol/proj';
import EsriJSON from 'ol/format/EsriJSON';
import { IQueryRequest, IFeatureType, IQueryFeatureTypeResponse, IExtended } from '../IExtended';
import { send, IResponse } from 'bhreq';
import { toGeoJSONGeometry, disjoint } from '../../utils';

export function agsQueryOne(
  source: IExtended,
  serviceUrl: string,
  type: IFeatureType<number>,
  request: IQueryRequest
): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, limit } = request;
  const mapProjection = olMap.getView().getProjection();
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
  const where = ''; // TODO
  const sr = mapProjection.getCode().split(':', 2)[1];
  const url = `${serviceUrl}/${type.id}/query?geometry=${extent.join(
    ','
  )}&geometryType=esriGeometryEnvelope&inSR=${sr}&outSR=${sr}&where=${where}&returnGeometry=true&f=json`;
  return send({ url }).then((res: IResponse) => {
    const features = [] as Feature[];
    // Read features
    const jsonQueryRes = res.body;
    const format = new EsriJSON();
    if (jsonQueryRes != null && jsonQueryRes.features != null && jsonQueryRes.features.length > 0) {
      jsonQueryRes.features.forEach((jsonFeature: any) => {
        if (limit == null || features.length < limit) {
          const feature = format.readFeature(jsonFeature) as Feature;
          // Check intersection
          if (
            geometry == null ||
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
      source
    });
  });
}
