export type SourceType =
  | SourceTypeEnum.ExternalVector
  | SourceTypeEnum.ImageArcGISRest
  | SourceTypeEnum.ImageStatic
  | SourceTypeEnum.ImageWms
  | SourceTypeEnum.LocalVector
  | SourceTypeEnum.QueryArcGISRest
  | SourceTypeEnum.TileArcGISRest
  | SourceTypeEnum.TileWms
  | SourceTypeEnum.Vector
  | SourceTypeEnum.VectorTile
  | SourceTypeEnum.Wfs
  | SourceTypeEnum.Xyz;

export enum SourceTypeEnum {
  ExternalVector = 'ExternalVector',
  ImageArcGISRest = 'ImageArcGISRest',
  ImageStatic = 'ImageStatic',
  ImageWms = 'ImageWms',
  LocalVector = 'LocalVector',
  QueryArcGISRest = 'QueryArcGISRest',
  TileArcGISRest = 'TileArcGISRest',
  TileWms = 'TileWms',
  Vector = 'Vector',
  VectorTile = 'VectorTile',
  Wfs = 'Wfs',
  Xyz = 'Xyz'
}
