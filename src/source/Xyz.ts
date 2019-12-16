import OlXyz from 'ol/source/XYZ';
import { IFeatureType, IQueryRequest, IQueryResponse, IExtendedOptions } from './IExtended';
import { ITileImage } from './ITileImage';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export class Xyz extends OlXyz implements ITileImage {
  protected options: IExtendedOptions;

  constructor(options: IExtendedOptions = {}) {
    super({ ...options } as any);
    this.options = { ...options };
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

  public getSourceType(): SourceType {
    return SourceTypeEnum.Xyz;
  }

  public getSourceOptions(): IExtendedOptions {
    return this.options;
  }

  public setSourceOptions(options: IExtendedOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Tile;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }
}
