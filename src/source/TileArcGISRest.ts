import OlTileArcGISRest from 'ol/source/TileArcGISRest';
import Feature from 'ol/Feature';
import { IQueryRequest, IQueryResponse, IFeatureType, IExtendedOptions } from './IExtended';
import { ITileImage } from './ITileImage';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export class TileArcGISRest extends OlTileArcGISRest implements ITileImage {
  protected options: any;

  constructor(options: IExtendedOptions = {}) {
    super({ ...options } as any);
    this.options = { ...options };
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.TileArcGISRest;
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

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    const features = [] as Feature[];
    return Promise.resolve({
      request,
      featureTypeResponses: [
        {
          features
        }
      ]
    });
  }
}
