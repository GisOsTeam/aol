import OlWmts, { Options } from 'ol/source/WMTS';
import { IRetryable, ISnapshotOptions, ISnapshotSource } from './IExtended';
import { LayerTypeEnum, SourceTypeEnum } from './types';
import { LoadFunction as OlTileLoadFunction } from 'ol/Tile';
import {
  createTileLoadWithHttpEngineFunction,
} from '../utils/image-load-function.utils';
import { SourceRetryableOptionsSanitizer } from '../sanitizers';

export interface IWmtsOptions extends ISnapshotOptions, IRetryable, Options {
  loadImagesWithHttpEngine?: boolean;
}

export class Wmts extends OlWmts implements ISnapshotSource {
  protected options: IWmtsOptions;
  private defaultTileLoadFunction: OlTileLoadFunction | undefined;

  constructor(options: IWmtsOptions) {
    super({ crossOrigin: 'anonymous', ...options });
    this.options = {
      ...options,
      ...SourceRetryableOptionsSanitizer.sanitize(options)
    };
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

  public getLayerType(): LayerTypeEnum {
    return LayerTypeEnum.Tile;
  }

  public getSourceOptions(): IWmtsOptions {
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
    this.options = {
      ...options,
      ...SourceRetryableOptionsSanitizer.sanitize(options)
    };

    if (this.options.loadImagesWithHttpEngine) {
      // Save default OL function
      if (this.defaultTileLoadFunction === undefined) {
        this.defaultTileLoadFunction = this.getTileLoadFunction();
      }

      // Register custom tile load function with HttpEngine use
      this.setTileLoadFunction(
        createTileLoadWithHttpEngineFunction(this.options),
      );
    } else if (this.defaultTileLoadFunction !== undefined) {
      // There was a custom function : unregister it and restore default OL function
      this.setTileLoadFunction(this.defaultTileLoadFunction);
      this.defaultTileLoadFunction = undefined;
    }
  }
}
