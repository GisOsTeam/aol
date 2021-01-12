export type SourceType =
  | SourceTypeEnum.ExternalVector
  | SourceTypeEnum.ImageArcGISRest
  | SourceTypeEnum.ImageStatic
  | SourceTypeEnum.ImageWms
  | SourceTypeEnum.LocalVector
  | SourceTypeEnum.Osm
  | SourceTypeEnum.QueryArcGISRest
  | SourceTypeEnum.TileArcGISRest
  | SourceTypeEnum.TileWfs
  | SourceTypeEnum.TileWms
  | SourceTypeEnum.Vector
  | SourceTypeEnum.VectorTile
  | SourceTypeEnum.Wfs
  | SourceTypeEnum.Wmts
  | SourceTypeEnum.WmtsCapabilities
  | SourceTypeEnum.Xyz;

export enum SourceTypeEnum {
  ExternalVector = 'ExternalVector',
  ImageArcGISRest = 'ImageArcGISRest',
  ImageStatic = 'ImageStatic',
  ImageWms = 'ImageWms',
  LocalVector = 'LocalVector',
  Osm = 'Osm',
  QueryArcGISRest = 'QueryArcGISRest',
  TileArcGISRest = 'TileArcGISRest',
  TileWfs = 'TileWfs',
  TileWms = 'TileWms',
  Vector = 'Vector',
  VectorTile = 'VectorTile',
  Wfs = 'Wfs',
  Wmts = 'Wmts',
  WmtsCapabilities = 'WmtsCapabilities',
  Xyz = 'Xyz',
}
