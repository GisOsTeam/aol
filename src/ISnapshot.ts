import { LayerTypeEnum } from './source/types/layerType';
import { SourceTypeEnum } from './source/types/sourceType';
import { Extent } from 'ol/extent';

export interface ISnapshot {
  view: ISnapshotView;
  projections: ISnapshotProjection[];
  layers: ISnapshotLayer[];
}

export interface ISnapshotView {
  center: [number, number];
  zoom: number;
  projectionCode: string;
  constrainResolution: boolean;
}

export interface ISnapshotProjection {
  code: string;
  wkt?: string;
  lonLatValidity?: Extent;
  name?: string;
  remarks?: string;
}

export interface ISnapshotLayer {
  layerType: LayerTypeEnum;
  layerOptions: any;
  sourceType: SourceTypeEnum;
  sourceOptions: any;
}
