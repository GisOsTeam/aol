import OlMap from 'ol/Map';
import Source, { Options } from 'ol/source/Source';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Geometry from 'ol/geom/Geometry';
import Projection from 'ol/proj/Projection';
import { SourceType } from './types/sourceType';
import { LayerType } from './types/layerType';
import { IPredicate } from '../filter/predicate';

export interface ISnapshotOptions extends Options {
  snapshotable?: boolean;
  listable?: boolean;
}

export interface ISnapshotSource extends Source {
  getSourceType(): SourceType;
  getSourceOptions(): ISnapshotOptions;
  setSourceOptions(options: ISnapshotOptions): void;
  getLayerType(): LayerType;
  isSnapshotable(): boolean; // Can save snapshot
  isListable(): boolean; // Visible by others tools
}

export interface IInitSource extends ISnapshotSource {
  init(): Promise<void>;
}

export interface IQuerySource extends ISnapshotSource {
  query(identifyRequest: IQueryRequest): Promise<IQueryResponse>;
  retrieveFeature(id: number | string, featureProjection: Projection): Promise<Feature>;
}

export interface ILayerLegend {
  label?: string;
  /**
   * Either a base64 or an URL
   */
  srcImage: string;
  height?: number;
  width?: number;
}

export interface ILegendSource {
  fetchLegend(): Promise<Record<string, ILayerLegend[]>>;
}

export interface IExtended extends IInitSource, IQuerySource, IInitSource {}

// TODO: faudrait rename le type mais ca va faire des breakings changes :/
export type IQueryRequest = IGisQueryRequest | IIdentifyRequest;

export interface IAbstractGisRequest<T extends string> {
  olMap: OlMap;

  queryType: T;
  filters?: IPredicate<any, any, any>;
  limit?: number;
}

export interface IGisQueryRequest extends IAbstractGisRequest<'query'> {
  geometry?: Geometry;
  geometryProjection?: Projection;
}

export interface IIdentifyRequest extends IAbstractGisRequest<'identify'> {
  geometry: Geometry;
  geometryProjection: Projection;
  identifyTolerance?: number;
}

export interface IQueryResponse {
  request: IQueryRequest;
  featureTypeResponses: IQueryFeatureTypeResponse[];
}

export interface IQueryFeatureTypeResponse {
  type: IFeatureType<any>;
  features: Feature[];
  source: IQuerySource;
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
