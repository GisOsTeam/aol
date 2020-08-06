import OlGeoJSON from 'ol/format/GeoJSON';
import { ExternalVector } from './ExternalVector';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import { IFeatureType, ISnapshotOptions } from './IExtended';
import { Options } from 'ol/source/Vector';
import { HttpEngine } from '../HttpInterceptor';
import { IResponse } from 'bhreq';

export interface IWfsOptions extends ISnapshotOptions, Options {
  type: IFeatureType<string>;
  outputFormat?: string;
  version?: string;
  swapX?: boolean;
}

export class Wfs extends ExternalVector {
  protected options: IWfsOptions;
  private readonly defaultOptions: Pick<IWfsOptions, 'outputFormat' | 'version' | 'swapX'> = {
    outputFormat: 'application/json',
    version: '1.1.0',
    swapX: false,
  };

  constructor(options: IWfsOptions) {
    super({
      ...options,
      format: new OlGeoJSON(),
      loader: (extent, resolution, projection) => {
        const proj = projection.getCode();
        const xhr = new XMLHttpRequest();

        let url =
          this.options.url +
          '?service=WFS&' +
          'version=' +
          this.options.version +
          '&' +
          'request=GetFeature&' +
          'TypeName=' +
          this.options.type.id +
          '&' +
          'outputFormat=' +
          this.options.outputFormat +
          '&' +
          'srsname=' +
          proj;

        if (!this.options.swapX) {
          url += '&bbox=' + extent.join(',') + ',' + proj;
        } else {
          url += `&bbox=${extent[1]},${extent[0]},${extent[3]},${extent[2]},${proj}`;
        }

        const httpEngine = HttpEngine.getInstance();
        const onError = () => {
          this.removeLoadedExtent(extent);
        };

        httpEngine
          .send({
            url,
            method: 'GET',
            responseType: 'text',
          })
          .then((res: IResponse) => {
            if (res.status === 200) {
              this.addFeatures(this.getFormat().readFeatures(res.text as any) as any);
            } else {
              onError();
            }
          })
          .catch(onError);
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
