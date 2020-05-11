import OlMap from 'ol/Map';
import Source from 'ol/source/Source';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Geometry from 'ol/geom/Geometry';
import Projection from 'ol/proj/Projection';
import { SourceType } from './types/sourceType';
import { LayerType } from './types/layerType';

export interface IExtendedOptions {
  snapshotable?: boolean;
  listable?: boolean;
}

export interface IExtended extends Source {
  init(): Promise<void>;
  getSourceType(): SourceType;
  getSourceOptions(): IExtendedOptions;
  setSourceOptions(options: IExtendedOptions): void;
  getLayerType(): LayerType;
  isSnapshotable(): boolean;
  isListable(): boolean;
  query(identifyRequest: IQueryRequest): Promise<IQueryResponse>;
  retrieveFeature(id: number | string, featureProjection: Projection): Promise<Feature>;
}

export interface IQueryRequest {
  olMap: OlMap;
  geometry: Geometry;
  geometryProjection: Projection;
  queryType: 'query' | 'identify';
  filters?: IFilter[];
  limit?: number;
  identifyTolerance?: number;
}

export interface IQueryResponse {
  request: IQueryRequest;
  featureTypeResponses: IQueryFeatureTypeResponse[];
}

export interface IQueryFeatureTypeResponse {
  type: IFeatureType<any>;
  features: Feature[];
  source: IExtended;
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
  hide?: boolean;
  name?: string;
  identifierAttribute?: IAttribute;
  attributes?: IAttribute[];
}

export function constructIdentifyQueryRequestFromPixel(pixel: number[], olMap: OlMap): IQueryRequest {
  const coord = olMap.getCoordinateFromPixel(pixel);
  return {
    olMap,
    geometry: new Point(coord),
    geometryProjection: olMap.getView().getProjection(),
    queryType: 'identify',
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
