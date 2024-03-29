import OlMap from 'ol/Map';
import Source, { Options } from 'ol/source/Source';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import Projection from 'ol/proj/Projection';
import { SourceType } from './types/sourceType';
import { LayerType } from './types/layerType';
import { IPredicate } from '../filter/predicate';

export interface ISnapshotOptions extends Options {
  snapshotable?: boolean;
  listable?: boolean;
  removable?: boolean;
}

export interface ISnapshotSource extends Source {
  getSourceType(): SourceType;

  getSourceOptions(): ISnapshotOptions;

  setSourceOptions(options: ISnapshotOptions): void;

  getLayerType(): LayerType;

  isSnapshotable(): boolean; // Can save snapshot

  isListable(): boolean; // Visible by others tools

  isRemovable(): boolean; // Removable from map by others tools
}

export interface IInitSource extends ISnapshotSource {
  init(): Promise<void>;
}

export interface IQuerySource extends ISnapshotSource {
  query(identifyRequest: IGisRequest, onlyVisible?: boolean): Promise<IQueryResponse>;

  retrieveFeature(id: number | string, featureProjection: Projection): Promise<Feature>;
}

export interface ILayerLegend {
  /**
   * Label optinal
   */
  label?: string;
  /**
   * Image element
   */
  image: HTMLImageElement;
  /**
   * Image data in Base64 ou url
   */
  srcImage: string;
  /**
   * Height
   */
  height: number;
  /**
   * Width
   */
  width: number;
}

export type ILegendRecord = Record<number | string, ILayerLegend[]>;

export interface ILegendSource {
  fetchLegend(): Promise<ILegendRecord>;
}

export interface IExtended extends IInitSource, IQuerySource, ILegendSource {}

export type IGisRequest = IQueryRequest | IIdentifyRequest;

export interface IAbstractRequest<T extends string> {
  olMap: OlMap;
  queryType: T;
  limit?: number;
  returnGeometry?: boolean;
  srId?: string;
  formatResponse?: boolean;
}

export interface IQueryRequest extends IAbstractRequest<'query'> {
  geometry?: Geometry;
  geometryProjection?: Projection;
  filters?: IPredicate;
  geometryPrecision?: number;
}

export interface IIdentifyRequest extends IAbstractRequest<'identify'> {
  geometry: Geometry;
  geometryPrecision?: number;
  geometryProjection: Projection;
  identifyTolerance?: number; // in pixel
  layersPrefix?: LayersPrefix;
  outFields?: string;
  returnFieldName?: boolean;
  returnGeometry?: boolean;
  srId?: string;
  filters?: Record<number, IPredicate>;

  types?: IFeatureType<any>[];
}

export interface IQueryResponse {
  request: IGisRequest;
  featureTypeResponses: (IQueryFeatureTypeResponse | IQueryUntypedResponse)[];
}

export interface IQueryFeatureTypeResponse {
  type: IFeatureType<any>;
  features: Feature[];
  source: IQuerySource;
}

export type UntypedResponse = any;

export interface IQueryUntypedResponse {
  response: UntypedResponse;
}

export interface IAttribute {
  key: string;
  type?: 'Oid' | 'Boolean' | 'Number' | 'String' | 'Date' | 'Geometry' | 'Unknown';
  name?: string;
}

export interface IFeatureType<IDT extends number | string> {
  id: IDT;
  queryId?: IDT;
  hide?: boolean;
  name?: string;
  identifierAttribute?: IAttribute;
  attributes?: IAttribute[];
  predicate?: IPredicate;
}
export type LayersPrefix = LayersPrefixEnum.ALL | LayersPrefixEnum.TOP | LayersPrefixEnum.VISIBLE;
export enum LayersPrefixEnum {
  ALL = 'all',
  TOP = 'top',
  VISIBLE = 'visible',
}
