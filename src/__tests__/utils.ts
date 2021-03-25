import { hash64, revertCoordinate } from '../utils';
import Point from 'ol/geom/Point';
import LinearRing from 'ol/geom/LinearRing';

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

  test('hash64', () => {
    testHash('a', hash64);
    testHash('&', hash64);
    testHash('{ }', hash64);
  });
});

function testHash(s: string, hashFn: (s: string) => string | number): void {
  expect(hashFn(`${s}`)).toEqual(hashFn(s));
}
