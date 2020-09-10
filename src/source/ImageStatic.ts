import OlImageStatic from 'ol/source/ImageStatic';
import { ISnapshotOptions, ISnapshotSource } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/ImageStatic';

export interface IImageStaticOptions extends ISnapshotOptions, Options {}

export class ImageStatic extends OlImageStatic implements ISnapshotSource {
  protected options: IImageStaticOptions;

  constructor(options: IImageStaticOptions) {
    super({ ...options } as any);
    this.options = options;
    if (this.options.crossOrigin == null) {
      this.options.crossOrigin = 'anonymous';
    }
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.ImageStatic;
  }

  public getSourceOptions(): IImageStaticOptions {
    return this.options;
  }

  public setSourceOptions(options: IImageStaticOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Image;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }
}
