import OlXyz from 'ol/source/XYZ';
import { ISnapshotOptions, ISnapshotSource } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/XYZ';
import { LoadFunction as OlTileLoadFunction } from 'ol/Tile';
import { tileLoadWithHttpEngineFunction } from '../utils/image-load-function.utils';

export interface IXyzOptions extends ISnapshotOptions, Options {
  loadImagesWithHttpEngine?: boolean;
}

export class Xyz extends OlXyz implements ISnapshotSource {
  protected options: IXyzOptions;
  private defaultTileLoadFunction: OlTileLoadFunction | undefined;

  constructor(options: IXyzOptions) {
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

    this.setSourceOptions(this.options);
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.Xyz;
  }

  public getSourceOptions(): IXyzOptions {
    return this.options;
  }

  public setSourceOptions(options: IXyzOptions): void {
    this.options = { ...options };

    if (options.loadImagesWithHttpEngine) {
      // Save default OL function
      if (this.defaultTileLoadFunction === undefined) {
        this.defaultTileLoadFunction = this.getTileLoadFunction();
      }

      // Register custom tile load function with HttpEngine use
      this.setTileLoadFunction(tileLoadWithHttpEngineFunction);
    } else if (this.defaultTileLoadFunction !== undefined) {
      // There was a custom function : unregister it and restore default OL function
      this.setTileLoadFunction(this.defaultTileLoadFunction);
      this.defaultTileLoadFunction = undefined;
    }
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
