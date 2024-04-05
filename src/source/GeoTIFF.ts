import OlGeoTIFF, { Options } from 'ol/source/GeoTIFF';
import { ISnapshotOptions, ISnapshotSource } from './IExtended';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';

export interface IGeoTIFFOptions extends ISnapshotOptions, Options {}

export class GeoTIFF extends OlGeoTIFF implements ISnapshotSource {
  protected options: IGeoTIFFOptions;

  constructor(options: IGeoTIFFOptions) {
    super({ ...options });
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
    return SourceTypeEnum.GeoTIFF;
  }

  public getSourceOptions(): IGeoTIFFOptions {
    return this.options;
  }

  public setSourceOptions(options: IGeoTIFFOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.WebGLTile;
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
