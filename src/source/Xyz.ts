import OlXyz from 'ol/source/XYZ';
import { IQueryRequest, IQueryResponse, IExtendedOptions, IExtended } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';

export interface IXyzOptions extends IExtendedOptions, Options {}

export class Xyz extends OlXyz implements IExtended {
  protected options: IXyzOptions;

  constructor(options: IXyzOptions) {
    super({ ...options } as any);
    this.options = { ...options };
  }

  public init(): Promise<void> {
    return Promise.resolve();
  }

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    return Promise.resolve({
      request,
      featureTypeResponses: [
        {
          type: null,
          features: [],
          source: this,
        },
      ],
    });
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    return Promise.resolve(null);
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
