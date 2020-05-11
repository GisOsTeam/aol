import OlWmts, { Options } from 'ol/source/WMTS';
import { IExtended, IExtendedOptions } from './IExtended';
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
    IExtendedOptions {}

export class Wmts extends OlWmts implements Omit<IExtended, 'init' | 'query' | 'retrieveFeature'> {
  protected options: WmtsOptions;

  constructor(options: WmtsOptions) {
    options.urls = [options.url + '?'];
    super({ ...options });
    this.options = { ...options };
    if (!('snapshotable' in this.options)) {
      this.options.snapshotable = true;
    }
    if (!('listable' in this.options)) {
      this.options.listable = true;
    }
  }

  getLayerType(): LayerTypeEnum {
    return LayerTypeEnum.Tile;
  }

  getSourceOptions(): IExtendedOptions {
    return this.options;
  }

  getSourceType(): SourceTypeEnum {
    return SourceTypeEnum.Wmts;
  }

  isListable(): boolean {
    return this.options.listable;
  }

  isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  setSourceOptions(options: WmtsOptions): void {
    this.options = { ...options };
    this.setProperties(this.options);
  }
}
