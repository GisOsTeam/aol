import { ImageWms } from '../../source';
import { Equal, IPredicate, Like } from '../../filter/predicate';
import { Equal as EqualOp, Like as LikeOp } from '../../filter/operator';
import { FieldTypeEnum, FilterBuilder, IField } from '../../filter';
import Projection from 'ol/proj/Projection';
import ImageWrapper from 'ol/Image';
import { IFeatureType } from '../../source/IExtended';

// Mock la date pour les fonctions gérant le cache
Date.now = jest.fn(() => 1487076708000); //14.02.2017

describe('aol.source.imageWms', () => {
  describe('Geoserver', () => {
    describe('Single Types', () => {
      const url = 'https://demo.geo-solutions.it/geoserver/geosolutions/wms';
      const sourceOptions = {
        url,
        types: [{ id: 'geosolutions:regioni' }],
        ratio: 1,
        params: { TRANSPARENT: true },
      };

      describe('refresh', () => {
        test('NOW should change when refrehsh call', () => {
          const imageWms = new ImageWms({ ...sourceOptions });
          expect(imageWms.getParams().NOW).toBe(1487076708000);
          Date.now = jest.fn(() => 1487077708000);
          imageWms.refresh();
          expect(imageWms.getParams().NOW).toBe(1487077708000);

          Date.now = jest.fn(() => 1487076708000);
        });
      });

      const imageLoadFunction = (image: ImageWrapper, src: string) => {
        expect(src).toMatchSnapshot();
      };

      const field: IField<any> = { type: FieldTypeEnum.String, key: 'REGIONE' };
      const equal: IPredicate = new Equal(field, new EqualOp(), 'Sicilia');
      const like: IPredicate = new Like(field, new LikeOp(), '%c%');
      const or: IPredicate = new FilterBuilder(equal).or(like).predicate;

      describe('filter', () => {
        describe('1 - constructor', () => {
          test("equal REGIONE='Sicilia'", async () => {
            const types: IFeatureType<string>[] = [{ id: 'geosolutions:regioni', initialPredicate: equal }];
            const imageWms = new ImageWms({ ...sourceOptions, ...{ types } });
            imageWms.setImageLoadFunction(imageLoadFunction);
            loadImageFromImageWms(imageWms);
          });
          test('like REGIONE like %c%', async () => {
            const types: IFeatureType<string>[] = [{ id: 'geosolutions:regioni', initialPredicate: like }];
            const imageWms = new ImageWms({ ...sourceOptions, ...{ types } });
            imageWms.setImageLoadFunction(imageLoadFunction);
            loadImageFromImageWms(imageWms);
          });
          test("or (REGIONE='Sicilia') or (REGIONE like %c%)", async () => {
            const types: IFeatureType<string>[] = [{ id: 'geosolutions:regioni', initialPredicate: or }];
            const imageWms = new ImageWms({ ...sourceOptions, ...{ types } });
            imageWms.setImageLoadFunction(imageLoadFunction);
            loadImageFromImageWms(imageWms);
          });
        });
        describe('2 - setSourceOptions', () => {
          test("equal REGIONE='Sicilia'", async () => {
            const imageWms = new ImageWms({ ...sourceOptions });
            imageWms.setImageLoadFunction(imageLoadFunction);
            const types: IFeatureType<string>[] = [{ id: 'geosolutions:regioni', initialPredicate: equal }];
            imageWms.setSourceOptions({ ...sourceOptions, ...{ types } });
            loadImageFromImageWms(imageWms);
          });
          test('like REGIONE like %c%', async () => {
            const imageWms = new ImageWms({ ...sourceOptions });
            imageWms.setImageLoadFunction(imageLoadFunction);
            const types: IFeatureType<string>[] = [{ id: 'geosolutions:regioni', initialPredicate: like }];
            imageWms.setSourceOptions({ ...sourceOptions, ...{ types } });
            loadImageFromImageWms(imageWms);
          });
          test("or (REGIONE='Sicilia') or (REGIONE like %c%)", async () => {
            const imageWms = new ImageWms({ ...sourceOptions });
            imageWms.setImageLoadFunction(imageLoadFunction);
            const types: IFeatureType<string>[] = [{ id: 'geosolutions:regioni', initialPredicate: or }];
            imageWms.setSourceOptions({ ...sourceOptions, ...{ types } });
            loadImageFromImageWms(imageWms);
          });
        });
        describe('3 - both', () => {
          const types: IFeatureType<string>[] = [{ id: 'geosolutions:regioni', initialPredicate: like }];
          const imageWms = new ImageWms({ ...sourceOptions, ...{ types } });
          imageWms.setImageLoadFunction(imageLoadFunction);

          test('(REGIONE like %c%) and (COD_REG=19) ', async () => {
            const field2: IField<any> = { type: FieldTypeEnum.Number, key: 'COD_REG' };
            const equal2: IPredicate = new Like(field2, new EqualOp(), 19);
            const types: IFeatureType<string>[] = [{ id: 'geosolutions:regioni', initialPredicate: equal2 }];
            imageWms.setSourceOptions({ ...sourceOptions, ...{ types } });
            loadImageFromImageWms(imageWms);
          });
        });
      });
    });
  });
});

const loadImageFromImageWms = (imageWms: ImageWms): void => {
  imageWms
    .getImage(
      [3870102.8510801145, -7329.74024825776, 5336050.900731673, 1458618.3094033008],
      2443,
      1,
      new Projection({ code: 'EPSG:3044' })
    )
    .load();
};
