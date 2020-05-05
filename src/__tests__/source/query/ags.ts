import { executeAgsQuery, loadAgsFeatureDescription } from '../../../source/query/ags';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { get as getProjection } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import { IQueryFeatureTypeResponse, IQueryRequest, IFeatureType } from '../../../source/IExtended';
import { ImageArcGISRest } from '../../../source/ImageArcGISRest';

const states = new ImageArcGISRest({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  types: [{ id: 2, identifierAttribute: { key: 'objectid' } }],
} as any);

test('describe ags', () => {
  const type: IFeatureType<number> = states.get('types')[0];
  return loadAgsFeatureDescription(states, type).then(() => {
    expect<string>(type.identifierAttribute.key).toEqual('objectid');
  });
});

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
  const type: IFeatureType<number> = states.get('types')[0];
  return executeAgsQuery(states, type, request).then((response: IQueryFeatureTypeResponse) => {
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
  const type: IFeatureType<number> = states.get('types')[0];
  return executeAgsQuery(states, type, request).then((response: IQueryFeatureTypeResponse) => {
    expect<number>(response.features.length).toEqual(1);
    expect<string>(response.features[0].getProperties().state_name).toEqual('Colorado');
  });
});