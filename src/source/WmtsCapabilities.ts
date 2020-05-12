import TileImage from 'ol/source/TileImage';
import { Options } from 'ol/source/WMTS';
import { ISnapshotOptions, IInitSource } from './IExtended';
import { LayerTypeEnum, SourceTypeEnum } from './types';
import { Wmts } from './Wmts';
import { WmtsProvider } from './provider';

export interface IWmtsCapabilitiesOptions
  extends ISnapshotOptions,
    Pick<Options, 'layer'>,
    Partial<Omit<Options, 'layer'>> {
  /**
   * Url utilisée pour récupérer les capabilities de la source
   */
  capabilitiesUrl?: string;
}

export class WmtsCapabilities extends TileImage implements IInitSource {
  protected options: IWmtsCapabilitiesOptions;

  protected internalWmtsSource: Wmts;

  constructor(options: IWmtsCapabilitiesOptions) {
    super(options);
    this.options = { ...options };
  }

  public init(): Promise<void> {
    return WmtsProvider.provideAsync(this.options).then((wmtsSource) => {
      this.internalWmtsSource = wmtsSource;
      this.setTileUrlFunction(this.internalWmtsSource.getTileUrlFunction());
    });
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

  public setSourceOptions(options: IWmtsCapabilitiesOptions): void {
    this.options = { ...options };
  }
}
