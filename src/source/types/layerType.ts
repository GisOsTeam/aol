export enum LayerTypeEnum {
  Image = 'Image',
  Tile = 'Tile',
  WebGLTile = 'WebGLTile',
  Vector = 'Vector',
  VectorTile = 'VectorTile',
}

export type LayerType = LayerTypeEnum.Image | LayerTypeEnum.Tile | LayerTypeEnum.WebGLTile | LayerTypeEnum.Vector | LayerTypeEnum.VectorTile;
