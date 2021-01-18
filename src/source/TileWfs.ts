import { VectorTile } from './VectorTile';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import {
  IGisRequest,
  IQueryResponse,
  ISnapshotOptions,
  IFeatureType,
  IInitSource,
  IQuerySource,
  IQueryFeatureTypeResponse,
} from './IExtended';
import { transformExtent } from 'ol/proj';
import { Options } from 'ol/source/VectorTile';
import VectorTileTile from 'ol/VectorTile';
import { loadWfsFeaturesOnBBOX, loadWfsFeatureDescription, executeWfsQuery, retrieveWfsFeature } from './query/wfs';
import Projection from 'ol/proj/Projection';
import { Feature } from 'ol';
import { TileCoord } from 'ol/tilecoord';

export interface ITileWfsOptions extends ISnapshotOptions, Options {
  url: string;
  type: IFeatureType<string>;
  outputFormat?: string;
  requestProjectionCode?: string;
  version?: string;
  swapXY?: boolean;
  limit?: number;
}

export class TileWfs extends VectorTile implements IInitSource, IQuerySource {
  protected options: ITileWfsOptions;
  private readonly defaultOptions: Pick<
    ITileWfsOptions,
    'outputFormat' | 'version' | 'requestProjectionCode' | 'swapXY' | 'limit'
  > = {
    outputFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.1.0',
    requestProjectionCode: 'EPSG:3857',
    swapXY: false,
    limit: 10000,
  };
  constructor(options: ITileWfsOptions) {
    super({
      ...options,
      tileUrlFunction: (tileCoord: TileCoord) => {
        return tileCoord == null ? undefined : `z${tileCoord[0]}|x${tileCoord[1]}|y${tileCoord[2]}`;
      },
      tileLoadFunction: (tile: VectorTileTile, url: string) => {
        tile.setLoader((extent, resolution, projection) => {
          const projectionCode = projection.getCode();

          const mapExtent = transformExtent(extent, projectionCode, this.options.requestProjectionCode);

          loadWfsFeaturesOnBBOX(
            'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
            this.options.type,
            'query',
            this.options.requestProjectionCode,
            projectionCode,
            mapExtent,
            this.options.limit,
            this.options.version,
            this.options.outputFormat,
            this.options.swapXY
          )
            .then(tile.onLoad.bind(tile))
            .catch(tile.onError.bind(tile));
        });
      },
    });
    this.options = { ...this.defaultOptions, ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
    if (this.options.removable != false) {
      this.options.removable = true;
    }
  }

  public init(): Promise<void> {
    return loadWfsFeatureDescription(
      'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
      this.options.type,
      this.options.version,
      this.options.outputFormat
    );
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.TileWfs;
  }

  public getSourceOptions(): ITileWfsOptions {
    return this.options;
  }

  public setSourceOptions(options: ITileWfsOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.VectorTile;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }

  public isRemovable(): boolean {
    return this.options.removable;
  }

  public setUrls(urls: string[]) {
    this.urls = urls;
  }

  public query(request: IGisRequest, onlyVisible = false): Promise<IQueryResponse> {
    return executeWfsQuery(
      this,
      'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
      this.options.type,
      request,
      this.options.version,
      this.options.outputFormat,
      this.options.requestProjectionCode,
      this.options.swapXY
    ).then((featureTypeResponse: IQueryFeatureTypeResponse) => {
      return {
        request,
        featureTypeResponses: [featureTypeResponse],
      };
    });
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    return retrieveWfsFeature(
      'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
      this.options.type,
      id,
      projection,
      this.options.version,
      this.options.outputFormat,
      this.options.requestProjectionCode,
      this.options.swapXY
    );
  }
}
