import Projection from 'ol/proj/Projection';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { transformExtent, get as getProjection } from 'ol/proj';
import { Extent } from 'ol/extent';

const projMap = new Map<string, ProjectionInfo>();

export function getProjectionInfo(code: string): ProjectionInfo {
  return projMap.get(code);
}

export function getProjectionInfos(): ProjectionInfo[] {
  const projectionInfos: ProjectionInfo[] = [];
  projMap.forEach(projectionInfo => {
    projectionInfos.push(projectionInfo);
  });
  return projectionInfos;
}

export function addProjection(
  code: string,
  wkt?: string,
  lonLatValidity?: Extent,
  name?: string,
  remarks?: string
): ProjectionInfo {
  const projectionInfo = new ProjectionInfo();
  projectionInfo.code = code;
  projectionInfo.wkt = wkt;
  projectionInfo.lonLatValidity = lonLatValidity;
  projectionInfo.name = name;
  projectionInfo.remarks = remarks;
  proj4.defs(projectionInfo.code, projectionInfo.wkt);
  console.info('Register projection ' + projectionInfo.code + ' - ' + projectionInfo.name);
  register(proj4);
  projectionInfo.projection = getProjection(projectionInfo.code);
  if (Array.isArray(projectionInfo.lonLatValidity)) {
    const extent = transformExtent(projectionInfo.lonLatValidity, 'EPSG:4326', projectionInfo.projection);
    projectionInfo.projection.setExtent(extent);
  }
  projMap.set(projectionInfo.code, projectionInfo);
  return projectionInfo;
}

export class ProjectionInfo {
  public code: string;
  public wkt: string;
  public lonLatValidity: Extent;
  public name: string;
  public remarks: string;
  public projection: Projection;
}
