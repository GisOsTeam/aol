import OlXyz from 'ol/source/XYZ';
import { IFeatureType, IQueryRequest, IQueryResponse } from './IExtended';
import { ITileImage } from './ITileImage';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

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

  public getSourceTypeName(): SourceType {
    return SourceTypeEnum.Xyz;
  }

  public getSourceOptions(): any {
    return this.options;
  }

  public getLayerTypeName(): LayerType {
    return LayerTypeEnum.Tile;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }
}
