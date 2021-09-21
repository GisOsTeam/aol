/**
 * Typescript file inspired by https://github.com/mclaeysb/turf-buffer project
 */

import * as simplepolygon from 'simplepolygon';
import * as turf from '@turf/turf';
import { AllGeoJSON, Feature, FeatureCollection, Geometry, Units } from '@turf/helpers';

/**
 *
 * @param {AllGeoJSON} feature - Feature in EPSG:4326 used to calculate new buffered feature
 * @param {number} radius - Radius of buffer in unit=units
 * @param {Units} [units=meters] - Unit of radius
 * @param {number} [resolution=64] -
 */
export function geodesicBuffer(
  feature: AllGeoJSON,
  radius: number,
  units: Units = 'meters',
  resolution = 64
): AllGeoJSON {
  if (radius < 0) {
    throw new Error('The buffer radius must be positive');
  }
  if (radius == 0) {
    return feature as Feature;
  }
  // FeatureCollection case
  if (feature.type === 'FeatureCollection') {
    const buffers: any[] = [];
    (feature as FeatureCollection).features.forEach(function (ft: Feature) {
      let featureBuffer: any;
      if (ft.geometry.type === 'Point') {
        return pointBuffer(ft, radius, units, resolution);
      } else if (ft.geometry.type === 'MultiPoint') {
        const buffers: any[] = [];
        ft.geometry.coordinates.forEach(function (coords: any) {
          buffers.push(pointBuffer(turf.point(coords), radius, units, resolution));
        });
        featureBuffer = turf.featureCollection(buffers);
      } else if (ft.geometry.type === 'LineString') {
        featureBuffer = lineBuffer(ft, radius, units, resolution);
      } else if (ft.geometry.type === 'MultiLineString') {
        const buffers: any[] = [];
        ft.geometry.coordinates.forEach(function (coords: any) {
          buffers.push(lineBuffer(turf.lineString(coords), radius, units, resolution));
        });
        featureBuffer = turf.featureCollection(buffers);
      } else if (ft.geometry.type === 'Polygon') {
        return polygonBuffer(ft, radius, units, resolution);
      } else if (ft.geometry.type === 'MultiPolygon') {
        const buffers: any[] = [];
        ft.geometry.coordinates.forEach(function (coords: any) {
          buffers.push(polygonBuffer(turf.polygon(coords), radius, units, resolution));
        });
        featureBuffer = turf.featureCollection(buffers);
      }
      if (featureBuffer.type === 'feature') {
        buffers.push(featureBuffer);
      } else {
        // featureBuffer.type === 'FeatureCollection'
        // eslint-disable-next-line prefer-spread
        buffers.push.apply(buffers, featureBuffer.features);
      }
    });
    return turf.featureCollection(buffers);
  }
  // Null or undefined feature geometry case
  if ((feature as Feature).geometry == null) return feature;
  // Simplify geometry if it's one of 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'
  if (['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'].indexOf((feature as Feature).geometry.type) > -1) {
    feature = turf.simplify(feature, { tolerance: turf.distanceToDegrees(radius / resolution, units) }); // radius/resolution seems like the optimal balance between speed and detail
  }
  if ((feature as Feature).geometry.type === 'Point') {
    return pointBuffer(feature, radius, units, resolution);
  } else if ((feature as Feature).geometry.type === 'MultiPoint') {
    const buffers: any[] = [];
    ((feature as Feature).geometry as Geometry).coordinates.forEach(function (coords: any) {
      buffers.push(pointBuffer(turf.point(coords), radius, units, resolution));
    });
    return turf.featureCollection(buffers);
  } else if ((feature as Feature).geometry.type === 'LineString') {
    return lineBuffer(feature, radius, units, resolution);
  } else if ((feature as Feature).geometry.type === 'MultiLineString') {
    const buffers: any[] = [];
    ((feature as Feature).geometry as Geometry).coordinates.forEach(function (coords: any) {
      buffers.push(lineBuffer(turf.lineString(coords), radius, units, resolution));
    });
    return turf.featureCollection(buffers);
  } else if ((feature as Feature).geometry.type === 'Polygon') {
    return polygonBuffer(feature, radius, units, resolution);
  } else if ((feature as Feature).geometry.type === 'MultiPolygon') {
    const buffers: any[] = [];
    ((feature as Feature).geometry as Geometry).coordinates.forEach(function (coords: any) {
      buffers.push(polygonBuffer(turf.polygon(coords), radius, units, resolution));
    });
    return turf.featureCollection(buffers);
  }
}

function pointBuffer(pt: any, radius: any, units: any, resolution: any) {
  const pointOffset: any[][] = [[]];
  const resMultiple = 360 / resolution;
  for (let i = 0; i < resolution; i++) {
    const spoke = turf.destination(pt, radius, i * resMultiple, { units: units });
    pointOffset[0].push(spoke.geometry.coordinates);
  }
  if (!equalArrays(pointOffset[0][0], pointOffset[0][pointOffset[0].length - 1])) {
    pointOffset[0].push(pointOffset[0][0]);
  }
  return turf.polygon(pointOffset);
}

function lineBuffer(line: any, radius: any, units: any, resolution: any) {
  const lineOffset: any[] = [];

  line.geometry.coordinates = removeDuplicates(line.geometry.coordinates);

  if (line.geometry.coordinates == 2) {
    line.geometry.coordinates.splice(
      1,
      0,
      turf.midpoint(turf.point(line.geometry.coordinates[0]), turf.point(line.geometry.coordinates[1])).geometry
        .coordinates
    );
  }

  if (!equalArrays(line.geometry.coordinates[0], line.geometry.coordinates[line.geometry.coordinates.length - 1])) {
    // situation at first point
    const firstLinePoint = turf.point(line.geometry.coordinates[0]);
    const secondLinePoint = turf.point(line.geometry.coordinates[1]);
    const firstLineBearing = turf.bearing(firstLinePoint, secondLinePoint);
    const firstBufferPoint = turf.destination(firstLinePoint, radius, firstLineBearing + 90, { units: units });

    // situation at last point
    const lastLinePoint = turf.point(line.geometry.coordinates[line.geometry.coordinates.length - 1]);
    const secondlastLinePoint = turf.point(line.geometry.coordinates[line.geometry.coordinates.length - 2]);
    const lastLineBearing = turf.bearing(lastLinePoint, secondlastLinePoint);

    lineOffset.push([]);
    lineOffset[0].push.apply(lineOffset[0], [firstBufferPoint.geometry.coordinates]); // Add first buffer point in order to close ring
    const offsetGeom1 = lineOffsetOneSide(line, radius, units, resolution, false, true);
    if (offsetGeom1 != null) {
      // eslint-disable-next-line prefer-spread
      lineOffset[0].push.apply(lineOffset[0], offsetGeom1.geometry.coordinates);
    }
    const arcGeom1 = arc(lastLinePoint, radius, lastLineBearing - 90, lastLineBearing + 90, units, resolution, true);
    if (arcGeom1 != null) {
      // eslint-disable-next-line prefer-spread
      lineOffset[0].push.apply(lineOffset[0], arcGeom1.geometry.coordinates);
    }
    const offsetGeom2 = lineOffsetOneSide(line, radius, units, resolution, true, true);
    if (offsetGeom2 != null) {
      // eslint-disable-next-line prefer-spread
      lineOffset[0].push.apply(lineOffset[0], offsetGeom2.geometry.coordinates);
    }
    const arcGeom2 = arc(firstLinePoint, radius, firstLineBearing - 90, firstLineBearing + 90, units, resolution, true);
    if (arcGeom2 != null) {
      // eslint-disable-next-line prefer-spread
      lineOffset[0].push.apply(lineOffset[0], arcGeom2.geometry.coordinates);
    }

    return offsetToBuffer(turf.polygon(lineOffset));
  } else {
    lineOffset.push(ringOffsetOneSide(line, radius, units, resolution, false, true).geometry.coordinates);
    lineOffset.push(ringOffsetOneSide(line, radius, units, resolution, true, true).geometry.coordinates);

    return offsetToBuffer(turf.polygon(lineOffset));
  }
}

function polygonBuffer(poly: any, radius: any, units: any, resolution: any) {
  const polygonOffset = [];

  poly = rewind(poly);

  poly.geometry.coordinates[0] = removeDuplicates(poly.geometry.coordinates[0]);
  for (let i = 1; i < poly.geometry.coordinates.length; i++) {
    poly.geometry.coordinates[i] = removeDuplicates(poly.geometry.coordinates[i]);
  }

  polygonOffset.push(
    ringOffsetOneSide(turf.lineString(poly.geometry.coordinates[0]), radius, units, resolution, false, true).geometry
      .coordinates
  );
  for (let i = 1; i < poly.geometry.coordinates.length; i++) {
    polygonOffset.push(
      ringOffsetOneSide(turf.lineString(poly.geometry.coordinates[i]), radius, units, resolution, false, true).geometry
        .coordinates
    );
  }

  return offsetToBuffer(turf.polygon(polygonOffset));
}

function lineOffsetOneSide(line: any, radius: any, units: any, resolution: any, reverse = false, right = true) {
  let coords: any[] = line.geometry.coordinates;
  if (reverse) coords = coords.reverse();

  const lineOffset: any[] = [];
  for (let i = 1; i < coords.length - 1; i++) {
    const previousLinePoint = turf.point(coords[i - 1]);
    const currentLinePoint = turf.point(coords[i]);
    const nextLinePoint = turf.point(coords[i + 1]);
    const previousLineBearing = turf.bearing(currentLinePoint, previousLinePoint);
    const nextLineBearing = turf.bearing(currentLinePoint, nextLinePoint);
    const arcGeom = arc(
      currentLinePoint,
      radius,
      previousLineBearing - Math.pow(-1, right ? 2 : 1) * 90,
      nextLineBearing + Math.pow(-1, right ? 2 : 1) * 90,
      units,
      resolution,
      right,
      true
    );
    if (arcGeom != null) {
      // eslint-disable-next-line prefer-spread
      lineOffset.push.apply(lineOffset, arcGeom.geometry.coordinates);
    }
  }

  if (lineOffset.length < 2) {
    return null;
  }
  return turf.lineString(lineOffset);
}

function ringOffsetOneSide(ring: any, radius: any, units: any, resolution: any, reverse = false, right = true) {
  let coords = ring.geometry.coordinates; // ring is a lineString
  if (reverse) coords = coords.reverse();
  const ringOffset: any[] = [];

  // situation at current point = point 0
  const previousRingPoint = turf.point(coords[coords.length - 2]);
  const currentRingPoint = turf.point(coords[0]);
  const nextRingPoint = turf.point(coords[1]);
  const nextRingBearing = turf.bearing(currentRingPoint, nextRingPoint);
  const currentBufferPoint = turf.destination(currentRingPoint, radius, nextRingBearing + 90, { units: units });
  const previousRingBearing = turf.bearing(currentRingPoint, previousRingPoint);

  // eslint-disable-next-line prefer-spread
  ringOffset.push.apply(ringOffset, [currentBufferPoint.geometry.coordinates]); // Add first buffer point in order to close ring
  const offsetGeom = lineOffsetOneSide(ring, radius, units, resolution, false, right);
  if (offsetGeom != null) {
    // eslint-disable-next-line prefer-spread
    ringOffset.push.apply(ringOffset, offsetGeom.geometry.coordinates);
  }
  const arcGeom = arc(
    currentRingPoint,
    radius,
    previousRingBearing - Math.pow(-1, right ? 2 : 1) * 90,
    nextRingBearing + Math.pow(-1, right ? 2 : 1) * 90,
    units,
    resolution,
    right,
    true
  );
  if (arcGeom != null) {
    // eslint-disable-next-line prefer-spread
    ringOffset.push.apply(ringOffset, arcGeom.geometry.coordinates);
  }

  return turf.lineString(ringOffset);
}

function arc(
  pt: any,
  radius: any,
  bearing1: any,
  bearing2: any,
  units: any,
  resolution: any,
  right = true,
  shortcut = false
) {
  const arc = [];
  const resMultiple = 360 / resolution;
  const angle = modulo(Math.pow(-1, right ? 2 : 1) * (bearing1 - bearing2), 360);
  let step = Math.floor(angle / resMultiple); // Counting steps first is easier than checking angle (angle involves checking 'right', 'modulo(360)', lefthandedness of bearings
  let bearing = bearing1;
  // Add spoke for bearing1
  let spoke = turf.destination(pt, radius, bearing1, { units: units });
  arc.push(spoke.geometry.coordinates);
  // Add spokes for all bearings between bearing1 to bearing2
  // But don't add spokes if the angle is reflex and the shortcut preference is set. In that case, just add bearing1 and bearing2. This prevents double, zigzag-overlapping arcs, and potentially non-unique vertices, when a lineOffsetOneSide is run on both sides.
  if (!(angle > 180 && shortcut)) {
    while (step) {
      bearing = bearing + Math.pow(-1, !right ? 2 : 1) * resMultiple;
      spoke = turf.destination(pt, radius, bearing, { units: units });
      arc.push(spoke.geometry.coordinates);
      step--;
    }
  } else {
    arc.push(pt.geometry.coordinates);
  }
  // Add spoke for bearing 2, but only if this spoke has not been added yet. Do this by checking the destination point, since slightly different bearings can create equal destination points.
  const spokeBearing2 = turf.destination(pt, radius, bearing2, { units: units });
  if (!equalArrays(spokeBearing2.geometry.coordinates, spoke.geometry.coordinates)) {
    arc.push(spokeBearing2.geometry.coordinates);
  }
  if (arc.length < 2) {
    return null;
  }
  return turf.lineString(arc);
}

function filterNetWinding(fc: any, filterFn: any) {
  const output = { type: 'FeatureCollection', features: [] as any };
  let i = fc.features.length;
  while (i--) {
    if (filterFn(fc.features[i].properties.netWinding)) {
      output.features.push({ type: 'Feature', geometry: fc.features[i].geometry, properties: {} });
    }
  }
  return output;
}

function unionFeatureCollection(fc: any) {
  // Note: union takes a polygon, but return a polygon or multipolygon (which it can not take in). In case of buffes, however, it will always return a polygon
  if (fc.features.length == 0) return { type: 'Feature', geometry: null, properties: {} };
  let incrementalUnion = fc.features[0];
  if (fc.features.length == 1) return incrementalUnion;
  for (let i = 1; i < fc.features.length; i++) {
    incrementalUnion = turf.union(incrementalUnion, fc.features[i]);
  }
  return incrementalUnion;
}

function offsetToBuffer(polygonOffset: any) {
  const sp = simplepolygon(polygonOffset);
  const unionWithWindingOne = unionFeatureCollection(
    filterNetWinding(sp, function (netWinding: any) {
      return netWinding == 1;
    })
  );
  const unionWithWindingZero = unionFeatureCollection(
    filterNetWinding(sp, function (netWinding: any) {
      return netWinding == 0;
    })
  );
  // This last one might have winding -1, so we might have to rewind it if the difference algorithm requires so

  if (unionWithWindingOne.geometry == null) return { type: 'Feature', geometry: null, properties: {} };
  if (unionWithWindingZero.geometry == null) return unionWithWindingOne;
  return turf.difference(unionWithWindingOne, unionWithWindingZero);
}

function winding(poly: any) {
  // compute winding of first ring
  const coords = poly.geometry.coordinates[0];
  let leftVtxIndex = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    if (coords[i][0] < coords[leftVtxIndex][0]) leftVtxIndex = i;
  }
  const prevVtx = coords[modulo(leftVtxIndex - 1, coords.length - 1)];
  const leftVtx = coords[leftVtxIndex];
  const nxtVtx = coords[modulo(leftVtxIndex + 1, coords.length - 1)];
  const atan1 = Math.atan((prevVtx[1] - leftVtx[1]) / (prevVtx[0] - leftVtx[0]));
  const atan2 = Math.atan((nxtVtx[1] - leftVtx[1]) / (nxtVtx[0] - leftVtx[0]));
  return atan1 > atan2 ? 1 : -1;
}

function rewind(poly: any) {
  // outer ring to winding +1, inner rings to winding -1
  if (winding(turf.polygon([poly.geometry.coordinates[0]])) == -1)
    poly.geometry.coordinates[0] = poly.geometry.coordinates[0].reverse();
  for (let i = 1; i < poly.geometry.coordinates.length; i++) {
    if (winding(turf.polygon([poly.geometry.coordinates[i]])) == 1)
      poly.geometry.coordinates[i] = poly.geometry.coordinates[i].reverse();
  }
  return poly;
}

function removeDuplicates(arr: any) {
  for (let i = arr.length - 1; i > 0; i--) {
    if (equalArrays(arr[i], arr[i - 1])) {
      arr.splice(i, 1);
    }
  }
  return arr;
}

// Function to compare Arrays of numbers. From http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
function equalArrays(array1: any, array2: any) {
  // if the other array is a falsy value, return
  if (!array1 || !array2) return false;

  // compare lengths - can save a lot of time
  if (array1.length != array2.length) return false;

  for (let i = 0, l = array1.length; i < l; i++) {
    // Check if we have nested arrays
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      // recurse into the nested arrays
      if (!equalArrays(array1[i], array2[i])) return false;
    } else if (array1[i] != array2[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}

// Fix Javascript modulo for negative number. From http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
function modulo(n: any, m: any) {
  return ((n % m) + m) % m;
}
