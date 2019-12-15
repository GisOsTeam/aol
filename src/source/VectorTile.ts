import OlVectorTile from 'ol/source/VectorTile';
import { IExtended, IQueryRequest, IQueryResponse } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { IVectorTileOptions } from './IVectorTile';

export abstract class VectorTile extends OlVectorTile implements IExtended {
  protected options: IVectorTileOptions;

  constructor(options: IVectorTileOptions = {}) {
    super(options);
    this.options = options;
  }

  public getSourceTypeName(): SourceType {
    return SourceTypeEnum.VectorTile;
  }

  public getSourceOptions(): IVectorTileOptions {
    return this.options;
  }

  public getLayerTypeName(): LayerType {
    return LayerTypeEnum.VectorTile;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
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
}
