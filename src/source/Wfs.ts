import { ExternalVector } from './ExternalVector';
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
import { Options } from 'ol/source/Vector';
import { loadWfsFeaturesOnBBOX, loadWfsFeatureDescription, executeWfsQuery, retrieveWfsFeature } from './query/wfs';
import Projection from 'ol/proj/Projection';
import { Feature } from 'ol';

export interface IWfsOptions extends ISnapshotOptions, Options {
  url: string;
  type: IFeatureType<string>;
  outputFormat?: string;
  requestProjectionCode?: string;
  version?: string;
  swapXY?: boolean;
  limit?: number;
}

export class Wfs extends ExternalVector implements IInitSource, IQuerySource {
  protected options: IWfsOptions;
  private readonly defaultOptions: Pick<
    IWfsOptions,
    'outputFormat' | 'version' | 'requestProjectionCode' | 'swapXY' | 'limit'
  > = {
    outputFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.1.0',
    requestProjectionCode: 'EPSG:3857',
    swapXY: false,
    limit: 10000,
  };
  constructor(options: IWfsOptions) {
    super({
      ...options,
      loader: (extent, resolution, projection) => {
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
    return loadWfsFeatureDescription(
      'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
      this.options.type,
      this.options.version,
      this.options.outputFormat
    );
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
