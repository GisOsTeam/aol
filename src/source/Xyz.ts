import OlXyz from 'ol/source/XYZ';
import { IQueryRequest, IQueryResponse, IExtendedOptions } from './IExtended';
import { ITileImage } from './ITileImage';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/XYZ';

export interface IXyzOptions extends IExtendedOptions, Options {}

export class Xyz extends OlXyz implements ITileImage {
  protected options: IXyzOptions;

  constructor(options: IXyzOptions) {
    super({ ...options } as any);
    this.options = { ...options };
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

  public getSourceType(): SourceType {
    return SourceTypeEnum.Xyz;
  }

  public getSourceOptions(): IXyzOptions {
    return this.options;
  }

  public setSourceOptions(options: IXyzOptions): void {
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
