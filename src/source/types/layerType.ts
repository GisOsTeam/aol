export enum LayerTypeEnum {
  Image = 'Image',
  Tile = 'Tile',
  Vector = 'Vector',
  VectorTile = 'VectorTile',
}

export type LayerType = LayerTypeEnum.Image | LayerTypeEnum.Tile | LayerTypeEnum.Vector | LayerTypeEnum.VectorTile;
