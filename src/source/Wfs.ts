import { ExternalVector } from './ExternalVector';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import { IGisRequest, IQueryResponse, IInitSource, IQuerySource } from './IExtended';
import { transformExtent } from 'ol/proj';
import { Options } from 'ol/source/Vector';
import { loadWfsFeaturesOnBBOX } from './query/wfs';
import Projection from 'ol/proj/Projection';
import { Feature } from 'ol';
import {
  ICommonWfsOptions,
  WFSInit,
  WFSInitializeOptions,
  WFSMergeOptions,
  WFSQuery,
  WFSRetrieveFeature,
} from './common/wfs';

export interface IWfsOptions extends ICommonWfsOptions, Omit<Options, 'url'> {}

export class Wfs extends ExternalVector implements IInitSource, IQuerySource {
  protected options: Required<IWfsOptions>;
  constructor(options: IWfsOptions) {
    super({
      ...options,
      loader: (extent, resolution, projection) => {
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
          method: this.options.method ?? 'GET',
          version: this.options.version,
          outputFormat: this.options.outputFormat,
          swapXYBBOXRequest: this.options.swapXYBBOXRequest,
          swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
        })
          .then((features) => this.addFeatures(features))
          .catch(() => this.removeLoadedExtent(extent));
      },
    });
    this.options = WFSInitializeOptions<IWfsOptions>(options);
  }

  public init(): Promise<void> {
    return WFSInit(this.options);
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.Wfs;
  }

  public getSourceOptions(): IWfsOptions {
    return this.options;
  }

  public setSourceOptions(options: IWfsOptions): void {
    this.options = WFSMergeOptions<IWfsOptions>(this.options, options);
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Vector;
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

  public query(request: IGisRequest, onlyVisible = false): Promise<IQueryResponse> {
    return WFSQuery(this, request, this.options, onlyVisible);
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    return WFSRetrieveFeature(id, projection, this.options);
  }
}
