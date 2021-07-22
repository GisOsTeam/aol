import { executeAgsQuery, loadAgsFeatureDescription } from '../../../source/query/ags';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { get as getProjection } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import { IFeatureType, IQueryFeatureTypeResponse, IGisRequest } from '../../../source/IExtended';
import { ImageArcGISRest } from '../../../source/ImageArcGISRest';
import { Equal as EqualPre, Like } from '../../../filter/predicate';
import { Equal as EqualOp, Like as LikeOp } from '../../../filter/operator';
import { FieldTypeEnum, IField } from '../../../filter';

const states = new ImageArcGISRest({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  types: [{ id: 2, identifierAttribute: { key: 'objectid' } }],
});

const stateNameField: IField<any> = {
  key: 'state_name',
  type: FieldTypeEnum.String,
};
describe('Ags', () => {
  test('describe ags', () => {
    const type: IFeatureType<number> = states.get('types')[0];
    return loadAgsFeatureDescription(states, type).then(() => {
      expect<string>(type.identifierAttribute.key).toEqual('objectid');
    });
  });

  describe('Query', () => {

    test('query ags geometry', () => {
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
      const type: IFeatureType<number> = states.get('types')[0];
      return executeAgsQuery(states, type, request).then((response: IQueryFeatureTypeResponse) => {
        expect<number>(response.features.length).toEqual(1);
        expect<string>(response.features[0].getProperties().state_name).toEqual('Colorado');
      });
    });

    test('query ags attr', () => {
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
        filters: new Like(stateNameField, new LikeOp(), 'Col%'),
        geometryProjection: getProjection('EPSG:3857'),
        queryType: 'query',
      };
      const type: IFeatureType<number> = states.get('types')[0];
      return executeAgsQuery(states, type, request).then((response: IQueryFeatureTypeResponse) => {
        expect<number>(response.features.length).toEqual(1);
        expect<string>(response.features[0].getProperties().state_name).toEqual('Colorado');
      });
    });
  });



  describe('Identify', () => {
    test('standard', () => {
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
      const type: IFeatureType<number> = states.get('types')[0];
      return executeAgsQuery(states, type, request).then((response: IQueryFeatureTypeResponse) => {
        expect<number>(response.features.length).toEqual(1);
        expect<string>(response.features[0].getProperties().STATE_NAME).toEqual('Colorado');
      });
    });

    test('with layerDefs', () => {
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
      const type: IFeatureType<number> = states.get('types')[0];
      const field: IField<number> = {
        key: 'STATE_NAME',
        type: FieldTypeEnum.String
      };
      type.predicate = new EqualPre(field, new EqualOp(true), "Colorado");
      return executeAgsQuery(states, type, request).then((response: IQueryFeatureTypeResponse) => {
        expect<number>(response.features.length).toEqual(0);
      });
    });
  });
});
