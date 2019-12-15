import OlTileArcGISRest from 'ol/source/TileArcGISRest';
import Feature from 'ol/Feature';
import { IQueryRequest, IQueryResponse, IFeatureType } from './IExtended';
import { ITileImage } from './ITileImage';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export class TileArcGISRest extends OlTileArcGISRest implements ITileImage {
  protected options: any;

  constructor(options: any = {}) {
    super(options);
    this.options = options;
  }

  public getSourceTypeName(): SourceType {
    return SourceTypeEnum.TileArcGISRest;
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
