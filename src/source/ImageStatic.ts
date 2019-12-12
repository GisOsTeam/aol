import OlImageStatic from 'ol/source/ImageStatic';
import { get as getProjection } from 'ol/proj';
import { IQueryRequest, IQueryResponse } from './IExtended';
import { IImage } from './IImage';

export class ImageStatic extends OlImageStatic implements IImage {
  protected options: any;

  private projectionCode: string;

  constructor(options: any = {}) {
    super(options);
    this.options = options;
    if (typeof options.projection === 'string') {
      this.projectionCode = options.projection;
    }
  }

  public getSourceTypeName(): string {
    return 'ImageStatic';
  }

  public getSourceOptions(): any {
    return this.options;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }

  getProjection() {
    if (this.projectionCode != null) {
      return getProjection(this.projectionCode);
    } else {
      super.getProjection();
    }
  }

  query(request: IQueryRequest): Promise<IQueryResponse> {
    return Promise.resolve({
      request,
      featureTypeResponses: [
        {
          features: []
        }
      ]
    });
  }
}
