import OlImageArcGISRest from 'ol/source/ImageArcGISRest';
import { IQueryRequest, IQueryResponse, IExtendedOptions, IQueryFeatureTypeResponse, IFeatureType } from './IExtended';
import { IImage } from './IImage';
import { getAgsLayersFromTypes } from '../utils';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { agsQueryOne } from './query/agsQuery';
import { Options } from 'ol/source/ImageArcGISRest';

export interface IImageArcGISRestOptions extends IExtendedOptions, Options {
  types: Array<IFeatureType<number>>;
}

export class ImageArcGISRest extends OlImageArcGISRest implements IImage {
  protected options: IImageArcGISRestOptions;

  constructor(options: IImageArcGISRestOptions) {
    super({ ...options } as any);
    this.options = options;
    this.set('types', options.types);
    this.updateParams({ ...this.getParams(), LAYERS: getAgsLayersFromTypes(options.types) });
    this.on('propertychange', this.handlePropertychange);
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.ImageArcGISRest;
  }

  public getSourceOptions(): IImageArcGISRestOptions {
    return this.options;
  }

  public setSourceOptions(options: IImageArcGISRestOptions): void {
    this.options = { ...options };
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
    const promises: Array<Promise<IQueryFeatureTypeResponse>> = [];
    for (const type of this.options.types) {
      promises.push(agsQueryOne(this.getUrl(), type, request));
    }
    return Promise.all(promises).then((featureTypeResponses: IQueryFeatureTypeResponse[]) => {
      return {
        request,
        featureTypeResponses
      };
    });
  }

  private handlePropertychange = (event: any) => {
    const key = event.key;
    const value = event.target.get(key);
    if (key === 'types') {
      this.updateParams({ ...this.getParams(), LAYERS: getAgsLayersFromTypes(value) });
      this.options.types = value;
    }
  };
}
