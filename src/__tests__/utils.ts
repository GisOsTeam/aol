import { buffer, hash64, revertCoordinate, toGeoJSONFeature, toOpenLayersFeature } from '../utils';
import Point from 'ol/geom/Point';
import LinearRing from 'ol/geom/LinearRing';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';

describe('utils', () => {
  test('revert Point coordinate', () => {
    const geometryToBeReverted = new Point([0, 1]);
    expect<number[]>(geometryToBeReverted.getCoordinates()).toEqual([0, 1]);
    revertCoordinate(geometryToBeReverted);
    expect<number[]>(geometryToBeReverted.getCoordinates()).toEqual([1, 0]);
  });

  test('revert LinearRing coordinate', () => {
    const geometryToBeReverted = new LinearRing([
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ]);
    expect<number[][]>(geometryToBeReverted.getCoordinates()).toEqual([
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ]);
    revertCoordinate(geometryToBeReverted);
    expect<number[][]>(geometryToBeReverted.getCoordinates()).toEqual([
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ]);
  });
  describe('buffer', () => {
    test('EPSG:4326', () => {
      const featureSource = new Feature();
      featureSource.setGeometry(
        new Polygon([
          [
            [-1, 0],
            [0, 1],
            [1, 0],
            [-1, 0],
          ],
        ])
      );
      const geoJSONFeatureSource = toGeoJSONFeature(featureSource);
      const geoJSONFeatureBuffered = buffer(geoJSONFeatureSource, 1);
      expect(toOpenLayersFeature(geoJSONFeatureBuffered).getGeometry().getType()).toEqual('Polygon');
      expect(JSON.stringify(geoJSONFeatureBuffered)).toMatchSnapshot();
    });
  });

  test('hash64', () => {
    testHash('a', hash64);
    testHash('&', hash64);
    testHash('{ }', hash64);
  });
});

function testHash(s: string, hashFn: (s: string) => string | number): void {
  expect(hashFn(`${s}`)).toEqual(hashFn(s));
}
