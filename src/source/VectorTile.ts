import OlVectorTile from 'ol/source/VectorTile';
import { ISnapshotOptions, ISnapshotSource } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/VectorTile';

export interface IVectorTileOptions extends ISnapshotOptions, Options {}

export class VectorTile extends OlVectorTile implements ISnapshotSource {
  protected options: IVectorTileOptions;

  constructor(options: IVectorTileOptions) {
    super({ ...options } as any);
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
    if (this.options.removable != false) {
      this.options.removable = true;
    }
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.VectorTile;
  }

  public getSourceOptions(): IVectorTileOptions {
    return this.options;
  }

  public setSourceOptions(options: IVectorTileOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.VectorTile;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }

  public isRemovable(): boolean {
    return this.options.removable;
  }
}
