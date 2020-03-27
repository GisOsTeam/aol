import OlImageWMS from 'ol/source/ImageWMS';
import {
  IQueryFeatureTypeResponse,
  IQueryRequest,
  IQueryResponse,
  IExtendedOptions,
  IFeatureType,
  IExtended,
} from './IExtended';
import { getWmsLayersFromTypes } from '../utils';
import { wmsQueryOne } from './query/wmsQuery';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { Options } from 'ol/source/ImageWMS';

export interface IImageWMSOptions extends IExtendedOptions, Options {
  types: IFeatureType<string>[];
}

export class ImageWms extends OlImageWMS implements IExtended {
  protected options: IImageWMSOptions;

  constructor(options: IImageWMSOptions) {
    super({ ...options } as any);
    this.options = { ...options };
    this.set('types', options.types);
    this.updateParams({ ...this.getParams(), LAYERS: getWmsLayersFromTypes(options.types) });
    this.on('propertychange', this.handlePropertychange);
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.ImageWms;
  }

  public getSourceOptions(): IImageWMSOptions {
    return this.options;
  }

  public setSourceOptions(options: IImageWMSOptions): void {
    this.options = { ...options };
    this.un('propertychange', this.handlePropertychange);
    this.set('types', options.types);
    this.updateParams({ ...this.getParams(), LAYERS: getWmsLayersFromTypes(options.types) });
    this.on('propertychange', this.handlePropertychange);
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Image;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    const promises: Promise<IQueryFeatureTypeResponse>[] = [];
    for (const type of this.options.types) {
      promises.push(wmsQueryOne(this, this.getUrl(), type, request));
    }
    return Promise.all(promises).then((featureTypeResponses: IQueryFeatureTypeResponse[]) => {
      return {
        request,
        featureTypeResponses,
      };
    });
  }

  private handlePropertychange = (event: any) => {
    const key = event.key;
    const value = event.target.get(key);
    if (key === 'types') {
      this.updateParams({ ...this.getParams(), LAYERS: getWmsLayersFromTypes(value) });
      this.options.types = value;
    }
  };
}
