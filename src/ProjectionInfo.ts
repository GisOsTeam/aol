import Projection from 'ol/proj/Projection';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { transformExtent, get as getProjection } from 'ol/proj';
import { Extent } from 'ol/extent';

export class ProjectionInfo {
  public code: string;
  public wkt: string;
  public lonLatValidity: Extent;
  public name: string;
  public remarks: string;
  public projection: Projection;
}

const projMap = new Map<string, ProjectionInfo>();

export function getProjectionInfo(code: string): ProjectionInfo {
  return projMap.get(code);
}

export function getProjectionInfos(): ProjectionInfo[] {
  const projectionInfos: ProjectionInfo[] = [];
  projMap.forEach((projectionInfo) => {
    projectionInfos.push(projectionInfo);
  });
  return projectionInfos;
}

export function addProjection(
  code: string,
  wkt?: string,
  lonLatValidity?: Extent,
  name?: string,
  remarks?: string,
): ProjectionInfo {
  if (code == null) {
    return null;
  }
  let projectionInfo = projMap.get(code);
  if (projectionInfo == null) {
    projectionInfo = new ProjectionInfo();
  }
  projectionInfo.code = code;
  if (wkt != null) {
    projectionInfo.wkt = wkt;
  }
  if (lonLatValidity != null) {
    projectionInfo.lonLatValidity = lonLatValidity;
  }
  if (name != null) {
    projectionInfo.name = name;
  }
  if (remarks != null) {
    projectionInfo.remarks = remarks;
  }
  if (proj4 == null) {
    console.warn('Proj4 is undefined !!!');
  } else {
    if (projectionInfo.wkt != null) {
      proj4.defs(projectionInfo.code, projectionInfo.wkt);
    }
    console.info('Register projection ' + projectionInfo.code + ' - ' + projectionInfo.name);
    register(proj4);
  }
  projectionInfo.projection = getProjection(projectionInfo.code);
  if (Array.isArray(projectionInfo.lonLatValidity) && projectionInfo.projection != null) {
    const extent = transformExtent(projectionInfo.lonLatValidity, 'EPSG:4326', projectionInfo.projection);
    projectionInfo.projection.setExtent(extent);
  }
  projMap.set(projectionInfo.code, projectionInfo);
  return projectionInfo;
}

// Add defaults projections
addProjection(
  'EPSG:3857',
  null,
  null,
  'WGS 84 / Pseudo-Mercator -- Spherical Mercator, Google Maps, OpenStreetMap, Bing, ArcGIS, ESRI',
  'Uses spherical development of ellipsoidal coordinates. Relative to WGS 84 / World Mercator (CRS code 3395) errors of 0.7 percent in scale and differences in northing of up to 43km in the map (equivalent to 21km on the ground) may arise.',
);
addProjection('EPSG:4326', null, null, 'WGS 84 -- WGS84 - World Geodetic System 1984, used in GPS', '');
