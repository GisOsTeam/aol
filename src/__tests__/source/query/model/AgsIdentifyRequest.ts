import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { ImageArcGISRest } from '../../../../source';
import { IFeatureType, IIdentifyRequest } from '../../../../source/IExtended';
import Polygon from 'ol/geom/Polygon';
import { get as getProjection } from 'ol/proj';
import { AgsIdentifyRequest } from '../../../../source/query/model/AgsIdentifyRequest';
import Point from 'ol/geom/Point';
import { addProjection } from '../../../../ProjectionInfo';

const states = new ImageArcGISRest({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  types: [{ id: 2, identifierAttribute: { key: 'objectid' } }],
});

const type: IFeatureType<number> = states.get('types')[0];

describe('AgsIdentifyRequest', () => {
  test('default (3857)', () => {
    const request: IIdentifyRequest = {
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
      returnGeometry: true,
      returnFieldName: true,
    };
    const agsQueryRequest = new AgsIdentifyRequest(states, [type], request);

    expect<string>(agsQueryRequest.f).toMatchSnapshot();
    expect<string>(agsQueryRequest.geometry).toMatchSnapshot('agsQueryRequest.geometry');
    expect<string>(agsQueryRequest.geometryPrecision).toMatchSnapshot('agsQueryRequest.geometryPrecision');
    expect<string>(agsQueryRequest.geometryType).toMatchSnapshot('agsQueryRequest.geometryType');
    expect<string>(agsQueryRequest.imageDisplay).toMatchSnapshot('agsQueryRequest.imageDisplay');
    expect<string>(agsQueryRequest.layerDefs).toMatchSnapshot('agsQueryRequest.layerDefs');
    expect<string>(agsQueryRequest.layers).toMatchSnapshot('agsQueryRequest.layers');
    expect<string>(agsQueryRequest.mapExtent).toMatchSnapshot('agsQueryRequest.mapExtent');
    expect<string>(agsQueryRequest.maxAllowableOffset).toMatchSnapshot('agsQueryRequest.maxAllowableOffset');
    expect<string>(agsQueryRequest.returnFieldName).toMatchSnapshot('agsQueryRequest.returnFieldName');
    expect<string>(agsQueryRequest.returnGeometry).toMatchSnapshot('agsQueryRequest.returnGeometry');
    expect<string>(agsQueryRequest.returnM).toMatchSnapshot('agsQueryRequest.returnM');
    expect<string>(agsQueryRequest.returnZ).toMatchSnapshot('agsQueryRequest.returnZ');
    expect<string>(agsQueryRequest.sr).toMatchSnapshot('agsQueryRequest.sr');
    expect<string>(agsQueryRequest.tolerance).toMatchSnapshot('agsQueryRequest.tolerance');
  });

  test('2154', () => {
    // addProjection(
    //   'EPSG:2154',
    //   '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    // );
    // const request: IIdentifyRequest = {
    //   olMap: new OlMap({
    //     view: new OlView({
    //       center: [0, 0],
    //       zoom: 1,
    //     }),
    //   }),
    //   geometry: new Point([827008.83, 6506549.89]),
    //   geometryProjection: getProjection('EPSG:2154'),
    //   queryType: 'identify',
    //   srId: '2154',
    // };
    // const agsQueryRequest = new AgsIdentifyRequest(states, [type], request);
    // expect<string>(agsQueryRequest.f).toMatchSnapshot();
    // expect<string>(agsQueryRequest.geometry).toMatchSnapshot('agsQueryRequest.geometry');
    // expect<string>(agsQueryRequest.geometryPrecision).toMatchSnapshot('agsQueryRequest.geometryPrecision');
    // expect<string>(agsQueryRequest.geometryType).toMatchSnapshot('agsQueryRequest.geometryType');
    // expect<string>(agsQueryRequest.imageDisplay).toMatchSnapshot('agsQueryRequest.imageDisplay');
    // expect<string>(agsQueryRequest.layerDefs).toMatchSnapshot('agsQueryRequest.layerDefs');
    // expect<string>(agsQueryRequest.layers).toMatchSnapshot('agsQueryRequest.layers');
    // expect<string>(agsQueryRequest.mapExtent).toMatchSnapshot('agsQueryRequest.mapExtent');
    // expect<string>(agsQueryRequest.maxAllowableOffset).toMatchSnapshot('agsQueryRequest.maxAllowableOffset');
    // expect<string>(agsQueryRequest.returnFieldName).toMatchSnapshot('agsQueryRequest.returnFieldName');
    // expect<string>(agsQueryRequest.returnGeometry).toMatchSnapshot('agsQueryRequest.returnGeometry');
    // expect<string>(agsQueryRequest.returnM).toMatchSnapshot('agsQueryRequest.returnM');
    // expect<string>(agsQueryRequest.returnZ).toMatchSnapshot('agsQueryRequest.returnZ');
    // expect<string>(agsQueryRequest.sr).toMatchSnapshot('agsQueryRequest.sr');
    // expect<string>(agsQueryRequest.tolerance).toMatchSnapshot('agsQueryRequest.tolerance');
  });

  test('3296', () => {
    // addProjection(
    //   'EPSG:3296',
    //   '+proj=utm +zone=5 +south +ellps=GRS80 +towgs84=0.072,-0.507,-0.245,-0.0183,0.0003,-0.007,-0.0093 +units=m +no_defs'
    // );
    // const request: IIdentifyRequest = {
    //   olMap: new OlMap({
    //     view: new OlView({
    //       center: [0, 0],
    //       zoom: 1,
    //     }),
    //   }),
    //   geometry: new Point([632635.3571388097, 8180019.336045767]),
    //   geometryProjection: getProjection('EPSG:3296'),
    //   queryType: 'identify',
    //   srId: '3296',
    //   geometryPrecision: 20,
    // };
    // const agsQueryRequest = new AgsIdentifyRequest(states, [type], request);
    // expect<string>(agsQueryRequest.f).toMatchSnapshot();
    // expect<string>(agsQueryRequest.geometry).toMatchSnapshot('agsQueryRequest.geometry');
    // expect<string>(agsQueryRequest.geometryPrecision).toMatchSnapshot('agsQueryRequest.geometryPrecision');
    // expect<string>(agsQueryRequest.geometryType).toMatchSnapshot('agsQueryRequest.geometryType');
    // expect<string>(agsQueryRequest.imageDisplay).toMatchSnapshot('agsQueryRequest.imageDisplay');
    // expect<string>(agsQueryRequest.layerDefs).toMatchSnapshot('agsQueryRequest.layerDefs');
    // expect<string>(agsQueryRequest.layers).toMatchSnapshot('agsQueryRequest.layers');
    // expect<string>(agsQueryRequest.mapExtent).toMatchSnapshot('agsQueryRequest.mapExtent');
    // expect<string>(agsQueryRequest.maxAllowableOffset).toMatchSnapshot('agsQueryRequest.maxAllowableOffset');
    // expect<string>(agsQueryRequest.returnFieldName).toMatchSnapshot('agsQueryRequest.returnFieldName');
    // expect<string>(agsQueryRequest.returnGeometry).toMatchSnapshot('agsQueryRequest.returnGeometry');
    // expect<string>(agsQueryRequest.returnM).toMatchSnapshot('agsQueryRequest.returnM');
    // expect<string>(agsQueryRequest.returnZ).toMatchSnapshot('agsQueryRequest.returnZ');
    // expect<string>(agsQueryRequest.sr).toMatchSnapshot('agsQueryRequest.sr');
    // expect<string>(agsQueryRequest.tolerance).toMatchSnapshot('agsQueryRequest.tolerance');
  });
});
