import OlGeoJSON from 'ol/format/GeoJSON';
import Projection from 'ol/proj/Projection';
import { ExternalVector } from './ExternalVector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { IExtendedOptions, IFeatureType } from './IExtended';
import { Options } from 'ol/source/Vector';

export interface IWfsOptions extends IExtendedOptions, Options {
  type: IFeatureType<string>;
}

export class Wfs extends ExternalVector {
  protected options: IWfsOptions;

  constructor(options: IWfsOptions) {
    super({
      ...options,
      format: new OlGeoJSON(),
      url: (extent: [number, number, number, number], resolution: number, projection: Projection) => {
        return `${this.getUrl()}?service=WFS&version=1.1.0&request=GetFeature&Type=${
          this.options.type.id
        }&outputFormat=application/json&srsname=${projection.getCode()}&bbox=${extent.join(
          ','
        )},${projection.getCode()}`;
      }
    });
    this.options = { ...options };
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
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }
}
