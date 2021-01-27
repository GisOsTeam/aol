import { executeWmsQuery, loadWmsFeatureDescription } from '../../../source/query/wms';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { get as getProjection } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import { IQueryFeatureTypeResponse, IGisRequest, IFeatureType } from '../../../source/IExtended';
import { ImageWms } from '../../../source/ImageWms';

const states = new ImageWms({
  url: 'https://ahocevar.com/geoserver/wms',
  types: [{ id: 'topp:states' }],
  params: {},
});

test('describe wms', () => {
  const type: IFeatureType<string> = states.get('types')[0];
  return loadWmsFeatureDescription({
    url: states.getUrl(),
    type,
    method: 'GET',
    outputFormat: 'text/xml; subtype=gml/3.1.1',
    version: '1.3.0',
    requestProjectionCode: 'EPSG:3857',
  }).then(() => {
    expect<number>(type.attributes.length).toEqual(23);
  });
});

test('query wms', () => {
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
    geometryProjection: getProjection('EPSG:3857'),
    queryType: 'query',
  };
  const type: IFeatureType<string> = states.get('types')[0];
  return executeWmsQuery({
    source: states,
    url: states.getUrl(),
    type,
    request,
    method: 'GET',
    outputFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.3.0',
    requestProjectionCode: 'EPSG:3857',
    swapXYBBOXRequest: false,
    swapLonLatGeometryResult: false,
  }).then((response: IQueryFeatureTypeResponse) => {
    expect<number>(response.features.length).toEqual(1);
    expect<string>(response.features[0].getProperties().STATE_NAME).toEqual('Colorado');
  });
});

test('identify wms', () => {
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
    geometryProjection: getProjection('EPSG:3857'),
    queryType: 'identify',
  };
  const type: IFeatureType<string> = states.get('types')[0];
  return executeWmsQuery({
    source: states,
    url: states.getUrl(),
    type,
    request,
    method: 'GET',
    outputFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.3.0',
    requestProjectionCode: 'EPSG:3857',
    swapXYBBOXRequest: false,
    swapLonLatGeometryResult: false,
  }).then((response: IQueryFeatureTypeResponse) => {
    expect<number>(response.features.length).toEqual(1);
    expect<string>(response.features[0].getProperties().STATE_NAME).toEqual('Colorado');
  });
});
