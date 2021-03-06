import OlWmts, { Options } from 'ol/source/WMTS';
import { ISnapshotOptions, ISnapshotSource } from './IExtended';
import { LayerTypeEnum, SourceTypeEnum } from './types';

export interface IWmtsOptions extends ISnapshotOptions, Options {}

export class Wmts extends OlWmts implements ISnapshotSource {
  protected options: IWmtsOptions;

  constructor(options: IWmtsOptions) {
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

  public getLayerType(): LayerTypeEnum {
    return LayerTypeEnum.Tile;
  }

  public getSourceOptions(): ISnapshotOptions {
    return this.options;
  }

  public getSourceType(): SourceTypeEnum {
    return SourceTypeEnum.Wmts;
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

  public setSourceOptions(options: IWmtsOptions): void {
    this.options = { ...options };
  }
}
