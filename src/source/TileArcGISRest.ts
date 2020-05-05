import OlTileArcGISRest from 'ol/source/TileArcGISRest';
import Feature from 'ol/Feature';
import { IQueryRequest, IQueryResponse, IFeatureType, IExtendedOptions, IExtended } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/TileArcGISRest';
import Projection from 'ol/proj/Projection';

export interface ITileArcGISRestOptions extends IExtendedOptions, Options {}

export class TileArcGISRest extends OlTileArcGISRest implements IExtended {
  protected options: any;

  constructor(options: ITileArcGISRestOptions) {
    super({ ...options } as any);
    this.options = { ...options };
  }

  public init(): Promise<void> {
    return Promise.resolve();
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.TileArcGISRest;
  }

  public getSourceOptions(): ITileArcGISRestOptions {
    return this.options;
  }

  public setSourceOptions(options: ITileArcGISRestOptions): void {
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

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    const features = [] as Feature[];
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
    return null;
  }
}
