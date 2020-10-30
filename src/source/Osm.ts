import OlOsm, { Options } from 'ol/source/OSM';
import { ISnapshotOptions, ISnapshotSource } from './IExtended';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';

export interface IOsmOptions extends ISnapshotOptions, Options {}

export class Osm extends OlOsm implements ISnapshotSource {
  protected options: IOsmOptions;

  constructor(options: IOsmOptions) {
    super({ crossOrigin: 'anonymous', ...options });
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
    return SourceTypeEnum.Osm;
  }

  public getSourceOptions(): IOsmOptions {
    return this.options;
  }

  public setSourceOptions(options: IOsmOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Tile;
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
