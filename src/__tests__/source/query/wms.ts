import { executeWmsQuery, loadWmsFeatureDescription } from '../../../source/query/wms';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { get as getProjection, Projection } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import { IQueryFeatureTypeResponse, IGisRequest, IFeatureType } from '../../../source/IExtended';
import { ImageWms } from '../../../source/ImageWms';

const states = new ImageWms({
  url: 'https://download.data.grandlyon.com/wms/rdata',
  types: [{ id: 'metropole-de-lyon:adr_voie_lieu.adrbanc_latest' }],
  params: {},
});

test('describe wms', () => {
  const type: IFeatureType<string> = states.get('types')[0];
  return loadWmsFeatureDescription({
    url: states.getUrl() as string,
    type,
    method: 'GET',
    outputFormat: 'text/xml; subtype=gml/3.1.1',
    version: '1.3.0',
    requestProjectionCode: 'EPSG:3857',
  }).then(() => {
    if (!type.attributes) {
      throw new Error('Attributes should not be undefined');
    }
    expect<number>(type.attributes.length).toMatchSnapshot();
  });
});

test('query wms', () => {
  const bbox = [561829.47003365, 5747718.13304753, 561829.47003365, 5747718.13304753];
  const request: IGisRequest = {
    olMap: new OlMap({
      view: new OlView({
        center: [0, 0],
        zoom: 1,
      }),
    }),
    geometry: new Polygon([
      [
        [bbox[0], bbox[1]], // bas-gauche
        [bbox[0], bbox[3]], // haut-gauche
        [bbox[2], bbox[3]], // haut-droit
        [bbox[2], bbox[1]], // bas-droit
        [bbox[0], bbox[1]], // fermeture
      ],
    ]),
    geometryProjection: getProjection('EPSG:3857') as Projection,
    queryType: 'query',
  };
  const type: IFeatureType<string> = states.get('types')[0];
  return executeWmsQuery({
    source: states,
    url: states.getUrl() as string,
    type,
    request,
    method: 'GET',
    outputFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.3.0',
    requestProjectionCode: 'EPSG:3857',
    swapXYBBOXRequest: false,
    swapLonLatGeometryResult: false,
  }).then((response: IQueryFeatureTypeResponse) => {
    expect<number>(response.features.length).toMatchSnapshot();
    expect(response.features[0].getProperties()).toMatchSnapshot();
  });
});

test('identify wms', () => {
  const bbox = [561829.47003365, 5747718.13304753, 561829.47003365, 5747718.13304753];
  const request: IGisRequest = {
    olMap: new OlMap({
      view: new OlView({
        center: [0, 0],
        zoom: 1,
      }),
    }),
    geometry: new Polygon([
      [
        [bbox[0], bbox[1]], // bas-gauche
        [bbox[0], bbox[3]], // haut-gauche
        [bbox[2], bbox[3]], // haut-droit
        [bbox[2], bbox[1]], // bas-droit
        [bbox[0], bbox[1]], // fermeture
      ],
    ]),
    geometryProjection: getProjection('EPSG:3857') as Projection,
    queryType: 'identify',
  };
  const type: IFeatureType<string> = states.get('types')[0];
  return executeWmsQuery({
    source: states,
    url: states.getUrl() as string,
    type,
    request,
    method: 'GET',
    outputFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.3.0',
    requestProjectionCode: 'EPSG:3857',
    swapXYBBOXRequest: false,
    swapLonLatGeometryResult: false,
  }).then((response: IQueryFeatureTypeResponse) => {
    expect<number>(response.features.length).toMatchSnapshot();
    expect(response.features[0].getProperties()).toMatchSnapshot();
  });
});
