import OlXyz from 'ol/source/XYZ';
import { IQueryRequest, IQueryResponse, IFeatureType } from './IExtended';
import { ITileImage } from './ITileImage';

export class Xyz extends OlXyz implements ITileImage {
  protected options: any;

  protected type: IFeatureType<number>[];

  constructor(options: any = {}) {
    super(options);
    this.options = options;
    this.type = options.type ? options.type : null;
  }

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    return Promise.resolve({
      request,
      featureTypeResponses: [
        {
          features: []
        }
      ]
    });
  }

  public getSourceTypeName(): string {
    return 'Xyz';
  }

  public getSourceOptions(): any {
    return this.options;
  }

  public getLayerTypeName(): string {
    return 'Tile';
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }
}
