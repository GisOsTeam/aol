export interface ISnapshot {
  view: ISnapshotView;
  projections: ISnapshotProjection[];
  layers: ISnapshotLayer[];
}

export interface ISnapshotView {
  center: [number, number];
  zoom: number;
  projectionCode: string;
}

export interface ISnapshotProjection {
  code: string;
  wkt?: string;
  lonLatValidity?: number[];
  name?: string;
  remarks?: string;
}

export interface ISnapshotLayer {
  sourceTypeName: string;
  sourceOptions: any;
  props: any;
}
