import OlGeoJSON from 'ol/format/GeoJSON';
import Projection from 'ol/proj/Projection';
import { ExternalVector } from './ExternalVector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { ISnapshotOptions, IFeatureType } from './IExtended';
import { Options } from 'ol/source/Vector';

export interface IWfsOptions extends ISnapshotOptions, Options {
  type: IFeatureType<string>;
  outputFormat?: string;
  version?: string;
}

export class Wfs extends ExternalVector {
  protected options: IWfsOptions;
  private readonly defaultOptions: Pick<IWfsOptions, 'outputFormat' | 'version'> = {
    outputFormat: 'application/json',
    version: '1.1.0',
  };

  constructor(options: IWfsOptions) {
    super({
      ...options,
      format: new OlGeoJSON(),
      url: (extent: [number, number, number, number], resolution: number, projection: Projection) => {
        return `${this.options.url}?service=WFS&version=${this.options.version}&request=GetFeature&TypeName=${
          this.options.type.id
        }&outputFormat=${this.options.outputFormat}&srsname=${projection.getCode()}&bbox=${extent.join(
          ','
        )},${projection.getCode()}`;
      },
    });
    this.options = { ...this.defaultOptions, ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.Wfs;
  }

  public getSourceOptions(): IWfsOptions {
    return this.options;
  }

  public setSourceOptions(options: IWfsOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Vector;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }
}
