import OlMap from 'ol/Map';
import Source from 'ol/source/Source';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import Projection from 'ol/proj/Projection';
import { fromExtent } from 'ol/geom/Polygon';
import { SourceType } from './types/sourceType';
import { LayerType } from './types/layerType';

export interface IExtended extends Source {
  getSourceTypeName(): SourceType;
  getSourceOptions(): any;
  getLayerTypeName(): LayerType;
  isSnapshotable(): boolean;
  isListable(): boolean;
  query(identifyRequest: IQueryRequest): Promise<IQueryResponse>;
}

// TODO create aolOption extend Option from ol

export interface IQueryRequest {
  mapProjection: Projection;
  geometry: Geometry;
  geometryProjection: Projection;
  filters?: IFilter[];
  limit?: number;
}

export interface IQueryResponse {
  request: IQueryRequest;
  featureTypeResponses: IQueryFeatureTypeResponse[];
}

export interface IQueryFeatureTypeResponse {
  type?: IFeatureType<any>;
  features: Feature[];
}

export interface IFilter {
  op: Op;
  attr?: IAttribute;
  value?: string | number | boolean;
  filters?: IFilter[];
}

export interface IAttribute {
  key: string;
  type?: 'Oid' | 'Boolean' | 'Number' | 'String' | 'Date' | 'Geometry' | 'Unknown';
  name?: string;
}

export interface IFeatureType<IDT extends number | string> {
  id: IDT;
  name?: string;
  identifierAttribute?: IAttribute;
  attributes?: IAttribute[];
}

export function constructQueryRequestFromPixel(pixel: number[], tolerance: number, olMap: OlMap): IQueryRequest {
  const coord = olMap.getCoordinateFromPixel(pixel);
  const resolution = olMap.getView().getResolution();
  const extent: [number, number, number, number] = [
    coord[0] - tolerance * resolution,
    coord[1] - tolerance * resolution,
    coord[0] + tolerance * resolution,
    coord[1] + tolerance * resolution
  ];
  return {
    mapProjection: olMap.getView().getProjection(),
    geometry: fromExtent(extent),
    geometryProjection: olMap.getView().getProjection()
  };
}

// And operation for group
// Or operation for group
// Eq operation for attribute (? = ?)
// Neq operation for attribute (? != ?)
// Gt operation for attribute (? > ?)
// Gte operation for attribute (? >= ?)
// Lt operation for attribute (? < ?)
// Lte operation for attribute (? <= ?)
// Lk operation for attribute (? LIKE ?)
// Nlk operation for attribute (? NOT LIKE ?)
// Ilk operation for attribute (? ILIKE ?)
// Nilk operation for attribute (? NOT ILIKE ?)
// Null operation for attribute (? IS NULL)
// Nnull operation for attribute (? IS NOT NULL)
export type Op =
  | 'and'
  | 'or'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'lk'
  | 'nlk'
  | 'ilk'
  | 'nilk'
  | 'null'
  | 'nnull';
