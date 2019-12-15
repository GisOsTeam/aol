import OlImageWMS from 'ol/source/ImageWMS';
import { IQueryFeatureTypeResponse, IQueryRequest, IQueryResponse } from './IExtended';
import { IImage } from './IImage';
import { getLayersFromTypes } from '../utils';
import { wmsQueryOne } from './query/wmsQuery';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { SourceType, SourceTypeEnum } from './types/sourceType';

export class ImageWms extends OlImageWMS implements IImage {
  protected options: any;

  constructor(options: any = {}) {
    super({ ...options });
    this.options = options;
    this.set('types', options.types);
    this.updateParams({ ...this.getParams(), LAYERS: getLayersFromTypes(options.types) });
    this.on('propertychange', this.handlePropertychange);
  }

  public getSourceTypeName(): SourceType {
    return SourceTypeEnum.ImageWms;
  }

  public getSourceOptions(): any {
    return this.options;
  }

  public getLayerTypeName(): LayerType {
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
      promises.push(wmsQueryOne(this.getUrl(), type, request));
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
      this.updateParams({ ...this.getParams(), LAYERS: getLayersFromTypes(value) });
      this.options.types = value;
    }
  };
}
