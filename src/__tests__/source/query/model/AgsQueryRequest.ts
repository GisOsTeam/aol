import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { ImageArcGISRest } from '../../../../source';
import { IFeatureType, IGisRequest } from '../../../../source/IExtended';
import Polygon from 'ol/geom/Polygon';
import { get as getProjection, Projection } from 'ol/proj';
import { AgsQueryRequest } from '../../../../source/query/model/AgsQueryRequest';

const states = new ImageArcGISRest({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  types: [{ id: 2, identifierAttribute: { key: 'objectid' } }],
});

const type: IFeatureType<number> = states.get('types')[0];

test('Simple AgsQueryRequest', () => {
  const request: IGisRequest = {
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
    geometryProjection: getProjection('EPSG:3857') as Projection,
    queryType: 'query',
  };
  const agsQueryRequest = new AgsQueryRequest(states, type, request);

  expect<string>(agsQueryRequest.f).toMatchSnapshot('agsQueryRequest.f');
  expect<string>(agsQueryRequest.distance).toMatchSnapshot('agsQueryRequest.distance');
  expect<string>(agsQueryRequest.geometry).toMatchSnapshot('agsQueryRequest.geometry');
  expect<string>(agsQueryRequest.geometryPrecision).toMatchSnapshot('agsQueryRequest.geometryPrecision');
  expect<string>(agsQueryRequest.geometryType).toMatchSnapshot('agsQueryRequest.geometryType');
  expect<string>(agsQueryRequest.historicMoment).toMatchSnapshot('agsQueryRequest.historicMoment');
  expect<string>(agsQueryRequest.inSR).toMatchSnapshot('agsQueryRequest.inSR');
  expect<string>(agsQueryRequest.maxAllowableOffset).toMatchSnapshot('agsQueryRequest.maxAllowableOffset');
  expect<string>(agsQueryRequest.objectIds).toMatchSnapshot('agsQueryRequest.objectIds');
  expect<string>(agsQueryRequest.orderByFields).toMatchSnapshot('agsQueryRequest.orderByFields');
  expect<string>(agsQueryRequest.outFields).toMatchSnapshot('agsQueryRequest.outFields');
  expect<string>(agsQueryRequest.outSR).toMatchSnapshot('agsQueryRequest.outSR');
  expect<string>(agsQueryRequest.parameterValues).toMatchSnapshot('agsQueryRequest.parameterValues');
  expect<string>(agsQueryRequest.rangeValues).toMatchSnapshot('agsQueryRequest.rangeValues');
  expect<string>(agsQueryRequest.relationParam).toMatchSnapshot('agsQueryRequest.relationParam');
  expect<string>(agsQueryRequest.resultOffset).toMatchSnapshot('agsQueryRequest.resultOffset');
  expect<string>(agsQueryRequest.returnCountOnly).toMatchSnapshot('agsQueryRequest.returnCountOnly');
  expect<string>(agsQueryRequest.returnExtentOnly).toMatchSnapshot('agsQueryRequest.returnExtentOnly');
  expect<string>(agsQueryRequest.returnGeometry).toMatchSnapshot('agsQueryRequest.returnGeometry');
  expect<string>(agsQueryRequest.returnIdsOnly).toMatchSnapshot('agsQueryRequest.returnIdsOnly');
  expect<string>(agsQueryRequest.returnM).toMatchSnapshot('agsQueryRequest.returnM');
  expect<string>(agsQueryRequest.returnZ).toMatchSnapshot('agsQueryRequest.returnZ');
  expect<string>(agsQueryRequest.spatialRel).toMatchSnapshot('agsQueryRequest.spatialRel');
  expect<string>(agsQueryRequest.text).toMatchSnapshot('agsQueryRequest.text');
  expect<string>(agsQueryRequest.time).toMatchSnapshot('agsQueryRequest.time');
  expect<string>(agsQueryRequest.units).toMatchSnapshot('agsQueryRequest.units');
  expect<string>(agsQueryRequest.where).toMatchSnapshot('agsQueryRequest.where');
});
