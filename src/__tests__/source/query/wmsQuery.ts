import { wmsQueryOne } from '../../../source/query/wmsQuery';
import OlMap from 'ol/Map';
import { get as getProjection } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import { IQueryFeatureTypeResponse, IQueryRequest } from '../../../source/IExtended';

test('query wms', () => {
  const request: IQueryRequest = {
    olMap: new OlMap({}),
    geometry: new Polygon([
      [
        [-11580733.168194728, 4880526.966432655],
        [-11580733.168194728, 4964673.98309528],
        [-11496586.151532097, 4964673.983095286],
        [-11496586.151532097, 4880526.966432655],
        [-11580733.168194728, 4880526.966432655]
      ]
    ]),
    geometryProjection: getProjection('EPSG:3857')
  };
  return wmsQueryOne('https://ahocevar.com/geoserver/wms', { id: 'topp:states' }, request).then(
    (response: IQueryFeatureTypeResponse) => {
      return expect<number>(response.features.length).toEqual(1);
    }
  );
});
