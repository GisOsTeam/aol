import { agsQueryOne } from '../../../source/query/agsQuery';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { get as getProjection } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import { IQueryFeatureTypeResponse, IQueryRequest } from '../../../source/IExtended';
import { ImageArcGISRest } from '../../../source/ImageArcGISRest';

const states = new ImageArcGISRest({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  types: [{ id: 2 }],
} as any);

test('query ags', () => {
  const request: IQueryRequest = {
    olMap: new OlMap({
      view: new OlView({
        center: [0, 0],
        zoom: 1,
      }),
    }),
    geometry: new Polygon([
      [
        [-11580733.168194728, 4880526.966432655],
        [-11580733.168194728, 4964673.98309528],
        [-11496586.151532097, 4964673.983095286],
        [-11496586.151532097, 4880526.966432655],
        [-11580733.168194728, 4880526.966432655],
      ],
    ]),
    geometryProjection: getProjection('EPSG:3857'),
    queryType: 'query',
  };
  return agsQueryOne(states, { id: 2 }, request).then((response: IQueryFeatureTypeResponse) => {
    expect<number>(response.features.length).toEqual(1);
    expect<string>(response.features[0].getProperties().state_name).toEqual('Colorado');
  });
});

test('identify ags', () => {
  const request: IQueryRequest = {
    olMap: new OlMap({
      view: new OlView({
        center: [0, 0],
        zoom: 1,
      }),
    }),
    geometry: new Polygon([
      [
        [-11580733.168194728, 4880526.966432655],
        [-11580733.168194728, 4964673.98309528],
        [-11496586.151532097, 4964673.983095286],
        [-11496586.151532097, 4880526.966432655],
        [-11580733.168194728, 4880526.966432655],
      ],
    ]),
    geometryProjection: getProjection('EPSG:3857'),
    queryType: 'identify',
  };
  return agsQueryOne(states, { id: 2 }, request).then((response: IQueryFeatureTypeResponse) => {
    expect<number>(response.features.length).toEqual(1);
    expect<string>(response.features[0].getProperties().STATE_NAME).toEqual('Colorado');
  });
});
