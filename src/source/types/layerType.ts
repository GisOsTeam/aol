export enum LayerTypeEnum {
  Image = 'Image',
  Tile = 'Tile',
  WebGLTile = 'WebGLTile',
  Heatmap = 'Heatmap',
  Vector = 'Vector',
  VectorTile = 'VectorTile',
}

export type LayerType =
  | LayerTypeEnum.Image
  | LayerTypeEnum.Tile
  | LayerTypeEnum.WebGLTile
  | LayerTypeEnum.Heatmap
  | LayerTypeEnum.Vector
  | LayerTypeEnum.VectorTile;
