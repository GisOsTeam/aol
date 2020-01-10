import OlImageStatic from 'ol/source/ImageStatic';
import { get as getProjection } from 'ol/proj';
import { IQueryRequest, IQueryResponse, IExtendedOptions, IExtended } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/ImageStatic';

export interface IImageStaticOptions extends IExtendedOptions, Options {}

export class ImageStatic extends OlImageStatic implements IExtended {
  protected options: IImageStaticOptions;

  private projectionCode: string;

  constructor(options: IImageStaticOptions) {
    super({ ...options } as any);
    this.options = options;
    if (typeof options.projection === 'string') {
      this.projectionCode = options.projection;
    }
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.ImageStatic;
  }

  public getSourceOptions(): IImageStaticOptions {
    return this.options;
  }

  public setSourceOptions(options: IImageStaticOptions): void {
    this.options = { ...options };
    if (typeof options.projection === 'string') {
      this.projectionCode = options.projection;
    }
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

  public getProjection() {
    if (this.projectionCode != null) {
      return getProjection(this.projectionCode);
    } else {
      super.getProjection();
    }
  }

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    return Promise.resolve({
      request,
      featureTypeResponses: [
        {
          type: null,
          features: [],
          source: this
        }
      ]
    });
  }
}
