import OlVectorTile from 'ol/source/VectorTile';
import { IExtended, IQueryRequest, IQueryResponse, IExtendedOptions } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/Vector';

export interface IVectorTileOptions extends IExtendedOptions, Options {}

export abstract class VectorTile extends OlVectorTile implements IExtended {
  protected options: IVectorTileOptions;

  constructor(options: IVectorTileOptions) {
    super({ ...options } as any);
    this.options = { ...options };
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.VectorTile;
  }

  public getSourceOptions(): IVectorTileOptions {
    return this.options;
  }

  public setSourceOptions(options: IVectorTileOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
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
          type: null,
          features: [],
          source: this
        }
      ]
    });
  }
}
