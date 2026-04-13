import { VectorTile } from './VectorTile';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import { IGisRequest, IQueryResponse, IInitSource, IQuerySource } from './IExtended';
import { transformExtent } from 'ol/proj';
import { Options } from 'ol/source/VectorTile';
import OlVectorTile from 'ol/VectorTile';
import { loadWfsFeaturesOnBBOX } from './query/wfs';
import Projection from 'ol/proj/Projection';
import { Feature } from 'ol';
import { TileCoord } from 'ol/tilecoord';
import { Extent } from 'ol/extent';
import { FeatureLike } from 'ol/Feature';
import {
  ICommonWfsOptions,
  WFSInit,
  WFSInitializeOptions,
  WFSMergeOptions,
  WFSQuery,
  WFSRetrieveFeature,
} from './common/wfs';

export interface ITileWfsOptions extends ICommonWfsOptions, Omit<Options, 'url'> {}

export class TileWfs extends VectorTile implements IInitSource, IQuerySource {
  protected options: Required<ITileWfsOptions>;

  constructor(options: ITileWfsOptions) {
    super({
      ...options,
      tileUrlFunction: (tileCoord: TileCoord) => {
        return tileCoord == null ? undefined : `z${tileCoord[0]}|x${tileCoord[1]}|y${tileCoord[2]}`;
      },
      tileLoadFunction: (tile: OlVectorTile<FeatureLike>, url: string) => {
        tile.setLoader((extent: Extent, resolution: any, projection: { getCode: () => any }) => {
          const projectionCode = projection.getCode();

          const mapExtent = transformExtent(extent, projectionCode, this.options.requestProjectionCode);

          loadWfsFeaturesOnBBOX({
            url: 'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
            type: this.options.type,
            queryType: 'query',
            requestProjectionCode: this.options.requestProjectionCode,
            featureProjectionCode: projectionCode,
            bbox: mapExtent,
            limit: this.options.limit,
            version: this.options.version,
            outputFormat: this.options.outputFormat,
            swapXYBBOXRequest: this.options.swapXYBBOXRequest,
            swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
          })
            .then(tile.onLoad.bind(tile))
            .catch(tile.onError.bind(tile));
        });
      },
    });
    this.options = WFSInitializeOptions<ITileWfsOptions>(options);
  }

  public init(): Promise<void> {
    return WFSInit(this.options);
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.TileWfs;
  }

  public getSourceOptions(): ITileWfsOptions {
    return this.options;
  }

  public setSourceOptions(options: ITileWfsOptions): void {
    this.options = WFSMergeOptions<ITileWfsOptions>(this.options, options);
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
    return WFSQuery(this, request, this.options, onlyVisible);
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature | undefined> {
    return WFSRetrieveFeature(id, projection, this.options);
  }
}
