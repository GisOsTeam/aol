import { geodesicBuffer } from '../geodesic-buffer';
import { Feature, Polygon } from '@turf/helpers';
import * as stringGeoJSONLine from './geojson/line-4326.json';
import * as stringGeoJSONPoint from './geojson/point-4326.json';

describe('geodesic-buffer', () => {
  test('point', () => {
    const originalGeoJSONPoint: Feature = { ...stringGeoJSONPoint } as Feature;
    const bufferedGeoJSONPoint = geodesicBuffer(originalGeoJSONPoint, 10, 'meters', 4) as Feature;
    const bufferedGeometry = bufferedGeoJSONPoint.geometry as Polygon;
    // Snapshot the expected geometry
    expect(JSON.stringify(bufferedGeometry.coordinates)).toMatchSnapshot();
    // Test if resolution + 1 point was created ( + 1 point was the point which close geometry)
    expect(bufferedGeometry.coordinates[0].length).toBe(5);
    // Expect first point equal last point to verify if geometry was closed
    expect(bufferedGeometry.coordinates[0][0] === bufferedGeometry.coordinates[0][4]).toBeTruthy();
  });
  test('line', () => {
    const originalGeoJSON: Feature = { ...stringGeoJSONLine } as Feature;
    const bufferedGeoJSON = geodesicBuffer(originalGeoJSON, 10000, 'meters', 4) as Feature;
    const bufferedGeometry = bufferedGeoJSON.geometry as Polygon;
    // Snapshot the expected geometry
    expect(JSON.stringify(bufferedGeometry.coordinates)).toMatchSnapshot();
    // Test if resolution + 1 point was created ( + 1 point was the point which close geometry)
    expect(bufferedGeometry.coordinates[0].length).toBe(3 * 4);
    // Expect first point equal last point to verify if geometry was closed
    expect(bufferedGeometry.coordinates[0][0] === bufferedGeometry.coordinates[0][4]).toBeTruthy();
    // Snapshot the expected geometry
    expect(JSON.stringify(bufferedGeometry.coordinates[0])).toMatchSnapshot();
  });
});
