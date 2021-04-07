import { ImageArcGISRest, ImageWms } from '../../source';
import { Equal, IPredicate, Like } from '../../filter/predicate';
import { Equal as EqualOp, Like as LikeOp } from '../../filter/operator';
import { FieldTypeEnum, FilterBuilder, IField } from '../../filter';
import Projection from 'ol/proj/Projection';
import ImageWrapper from 'ol/Image';
import { FeatureType } from '../../source/IExtended';

// Mock la date pour les fonctions gérant le cache
Date.now = jest.fn(() => 1487076708000); //14.02.2017

describe('aol.source.imageArcGISRest', () => {
  describe('ArcGIS Online', () => {
    const url = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';
    const sourceOptions = {
      url,
      types: [
        { id: 1, identifierAttribute: { key: 'objectid' } },
        { id: 2, identifierAttribute: { key: 'objectid' } },
      ],
      ratio: 1,
      params: { TRANSPARENT: false },
    };

    describe('refresh', () => {
      test('NOW should change when refrehsh call', () => {
        const imageArcGISRest = new ImageArcGISRest({ ...sourceOptions });
        expect(imageArcGISRest.getParams().NOW).toBe(1487076708000);
        Date.now = jest.fn(() => 1487077708000);
        imageArcGISRest.refresh();
        expect(imageArcGISRest.getParams().NOW).toBe(1487077708000);

        Date.now = jest.fn(() => 1487076708000);
      });
    });
    const imageLoadFunction = (image: ImageWrapper, src: string) => {
      expect(src).toMatchSnapshot();
    };

    const field: IField<any> = { type: FieldTypeEnum.String, key: 'state_name' };
    const equal: IPredicate = new Equal(field, new EqualOp(), 'Washington');
    const like: IPredicate = new Like(field, new LikeOp(), '%Dako%');
    const or: IPredicate = new FilterBuilder(equal).or(like).predicate;

    describe('filter', () => {
      describe('1 - constructor', () => {
        test('equal', async () => {
          const types: FeatureType<number>[] = [
            new FeatureType({ id: 1, identifierAttribute: { key: 'objectid' } }),
            new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: equal },
          ];
          const imageArcGISRest = new ImageArcGISRest({ ...sourceOptions, ...{ types } });
          imageArcGISRest.setImageLoadFunction(imageLoadFunction);
          loadImageFromImageArcGISRest(imageArcGISRest);
        });
        test('like', async () => {
          const types: FeatureType<number>[] = [
            new FeatureType({ id: 1, identifierAttribute: { key: 'objectid' } }),
            new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: like }),
          ];
          const imageArcGISRest = new ImageArcGISRest({ ...sourceOptions, ...{ types } });
          imageArcGISRest.setImageLoadFunction(imageLoadFunction);
          loadImageFromImageArcGISRest(imageArcGISRest);
        });
        test('or', async () => {
          const types: FeatureType<number>[] = [
            new FeatureType({ id: 1, identifierAttribute: { key: 'objectid' } }),
            new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: or }),
          ];
          const imageArcGISRest = new ImageArcGISRest({ ...sourceOptions, ...{ types } });
          imageArcGISRest.setImageLoadFunction(imageLoadFunction);
          loadImageFromImageArcGISRest(imageArcGISRest);
        });
      });
      describe('2 - setSourceOptions', () => {
        const imageArcGISRest = new ImageArcGISRest({ ...sourceOptions });
        imageArcGISRest.setImageLoadFunction(imageLoadFunction);
        test('equal', async () => {
          const types: FeatureType<number>[] = [
            new FeatureType({ id: 1, identifierAttribute: { key: 'objectid' } }),
            new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: equal }),
          ];
          imageArcGISRest.setSourceOptions({ ...sourceOptions, ...{ types } });
          loadImageFromImageArcGISRest(imageArcGISRest);
        });
        test('like', async () => {
          const types: FeatureType<number>[] = [
            new FeatureType({ id: 1, identifierAttribute: { key: 'objectid' } }),
            new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: like }),
          ];
          imageArcGISRest.setSourceOptions({ ...sourceOptions, ...{ types } });
          loadImageFromImageArcGISRest(imageArcGISRest);
        });
        test('or', async () => {
          const types: FeatureType<number>[] = [
            new FeatureType({ id: 1, identifierAttribute: { key: 'objectid' } }),
            new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: or }),
          ];
          imageArcGISRest.setSourceOptions({ ...sourceOptions, ...{ types } });
          loadImageFromImageArcGISRest(imageArcGISRest);
        });
      });
      describe('3 - both', () => {
        const types: FeatureType<number>[] = [
          new FeatureType({ id: 1, identifierAttribute: { key: 'objectid' } }),
          new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: like }),
        ];
        const imageArcGISRest = new ImageArcGISRest({ ...sourceOptions, ...{ types } });
        imageArcGISRest.setImageLoadFunction(imageLoadFunction);

        test('', async () => {
          const like2: IPredicate = new Like(field, new LikeOp(), 'North%');
          const types: FeatureType<number>[] = [new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: like2 }];
          imageArcGISRest.setSourceOptions({ )...sourceOptions, ...{ types } });
          loadImageFromImageArcGISRest(imageArcGISRest);
        });

        test('', async () => {
          const types: FeatureType<number>[] = [new FeatureType({ id: 2, identifierAttribute: { key: 'objectid' }, predicate: equal }];
          imageArcGISRest.setSourceOptions({ )...sourceOptions, ...{ types } });
          loadImageFromImageArcGISRest(imageArcGISRest);
        });
      });
    });
  });
});

const loadImageFromImageArcGISRest = (imageArcGISRest: ImageArcGISRest): void => {
  const projection = new Projection({ code: 'EPSG:4326' });
  imageArcGISRest
    .getImage([-173.24789851593732, -69.43544422133593, -16.2692137558099, 109.10900234289849], 1, 1, projection)
    .load();
};
