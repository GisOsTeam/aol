import WMTS, { Options } from 'ol/source/WMTS';
import { ISnapshotOptions, IInitSource } from './IExtended';
import { LayerTypeEnum, SourceTypeEnum } from './types';
import { WmtsProvider } from './provider';

export interface IWmtsCapabilitiesOptions
  extends ISnapshotOptions,
    Pick<Options, 'layer'>,
    Partial<Omit<Options, 'layer'>> {
  /**
   * Url complete utilisée pour récupérer les capabilities de la source (doit contenir la query, exemple SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0)
   */
  capabilitiesUrl?: string;
}

export class WmtsCapabilities extends WMTS implements IInitSource {
  protected options: IWmtsCapabilitiesOptions;

  constructor(options: IWmtsCapabilitiesOptions) {
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

  public init(): Promise<void> {
    return WmtsProvider.provideAsync(this.options).then((wmtsSource) => {
      for (const propertyName in wmtsSource) {
        if (
          propertyName !== 'options' &&
          propertyName !== 'getLayerType' &&
          propertyName !== 'getSourceOptions' &&
          propertyName !== 'getSourceType' &&
          propertyName !== 'isSnapshotable' &&
          propertyName !== 'isListable' &&
          propertyName !== 'setSourceOptions'
        ) {
          (this as any)[propertyName] = (wmtsSource as any)[propertyName];
        }
      }
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

  public isRemovable(): boolean {
    return this.options.removable;
  }

  public setSourceOptions(options: IWmtsCapabilitiesOptions): void {
    this.options = { ...options };
  }
}
