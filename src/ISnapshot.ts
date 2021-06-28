import { LayerType, SourceType } from './source/types';
import {  } from './source/types';
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
  constrainResolution?: boolean;
}

export interface ISnapshotProjection {
  code: string;
  wkt?: string;
  lonLatValidity?: Extent;
  name?: string;
  remarks?: string;
}

export interface ISnapshotLayer {
  layerType?: LayerType;
  layerOptions?: any;
  sourceType?: SourceType;
  sourceOptions?: any;
}
