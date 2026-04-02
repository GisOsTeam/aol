import { ExternalVector } from './ExternalVector';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import { IGisRequest, IQueryResponse, ISnapshotOptions, IFeatureType, IInitSource, IQuerySource } from './IExtended';
import { transformExtent } from 'ol/proj';
import { Options } from 'ol/source/Vector';
import { loadWfsFeaturesOnBBOX } from './query/wfs';
import Projection from 'ol/proj/Projection';
import { Feature } from 'ol';
import { WFSInit, WFSQuery, WFSRetrieveFeature } from './communs/wfs';

export interface IWfsOptions extends ISnapshotOptions, Options<any> {
  url: string;
  type: IFeatureType<string>;
  outputFormat?: string;
  requestProjectionCode?: string;
  version?: '1.0.0' | '1.1.0' | '2.0.0';
  swapXYBBOXRequest?: boolean;
  swapLonLatGeometryResult?: boolean;
  limit?: number;
}

export class Wfs extends ExternalVector implements IInitSource, IQuerySource {
  protected options: IWfsOptions;
  private readonly defaultOptions: Pick<
    IWfsOptions,
    'outputFormat' | 'version' | 'requestProjectionCode' | 'swapXYBBOXRequest' | 'swapLonLatGeometryResult' | 'limit'
  > = {
    outputFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.1.0',
    requestProjectionCode: 'EPSG:3857',
    swapXYBBOXRequest: false,
    swapLonLatGeometryResult: false,
    limit: 10000,
  };
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
          version: this.options.version,
          outputFormat: this.options.outputFormat,
          swapXYBBOXRequest: this.options.swapXYBBOXRequest,
          swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
        })
          .then((features) => this.addFeatures(features))
          .catch(() => this.removeLoadedExtent(extent));
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
    return WFSInit(this.options);
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.Wfs;
  }

  public getSourceOptions(): IWfsOptions {
    return this.options;
  }

  public setSourceOptions(options: IWfsOptions): void {
    this.options = { ...options };
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
    return WFSQuery(request, onlyVisible);
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    return WFSRetrieveFeature(id, projection);
  }
}
