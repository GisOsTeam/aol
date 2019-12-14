import OlImageArcGISRest from 'ol/source/ImageArcGISRest';
import Feature from 'ol/Feature';
import { IQueryRequest, IQueryResponse, IFeatureType } from './IExtended';
import { IImage } from './IImage';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export class ImageArcGISRest extends OlImageArcGISRest implements IImage {
  protected options: any;

  constructor(options: any = {}) {
    super(options);
    this.options = options;
  }

  public getSourceTypeName(): SourceType {
    return SourceTypeEnum.ImageArcGISRest;
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

  query(request: IQueryRequest): Promise<IQueryResponse> {
    const features = [] as Feature[];
    return Promise.resolve({
      request,
      featureTypeResponses: [
        {
          features
        }
      ]
    });
  }
}
