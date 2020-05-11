import OlWmts, { Options } from 'ol/source/WMTS';
import { ISnapshotOptions, ISnapshotSource } from './IExtended';
import { LayerTypeEnum, SourceTypeEnum } from './types';

export interface WmtsSnapshotOptions extends Pick<Options, 'layer' | 'matrixSet' | 'url'> {
  /**
   * Url utilisée pour :
   *  * récupérer les capabilities de la source
   */
  capabilitiesUrl?: string;
}

export interface WmtsOptions
  extends Omit<Options, 'layer' | 'matrixSet' | 'url'>,
    WmtsSnapshotOptions,
    ISnapshotOptions {}

export class Wmts extends OlWmts implements ISnapshotSource {
  protected options: WmtsOptions;

  constructor(options: WmtsOptions) {
    options.urls = [options.url + '?'];
    super({ ...options });
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
  }

  getLayerType(): LayerTypeEnum {
    return LayerTypeEnum.Tile;
  }

  getSourceOptions(): ISnapshotOptions {
    return this.options;
  }

  getSourceType(): SourceTypeEnum {
    return SourceTypeEnum.Wmts;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }

  setSourceOptions(options: WmtsOptions): void {
    this.options = { ...options };
    this.setProperties(this.options);
  }
}
