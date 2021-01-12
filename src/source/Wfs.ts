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
  version?: string;
  swapX?: boolean;
  limit?: number;
}

export class Wfs extends ExternalVector implements IInitSource, IQuerySource {
  protected options: IWfsOptions;
  private readonly defaultOptions: Pick<IWfsOptions, 'outputFormat' | 'version' | 'swapX' | 'limit'> = {
    outputFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.1.0',
    swapX: false,
    limit: 10000,
  };

  constructor(options: IWfsOptions) {
    super({
      ...options,
      loader: (extent, resolution, projection) => {
        const proj = projection.getCode();

        const onError = (err: any) => {
          console.log(err);
          this.removeLoadedExtent(extent);
        };

        const requestProjectionCode = 'EPSG:3857';
        const mapExtent = transformExtent(extent, projection, requestProjectionCode);

        loadWfsFeaturesOnBBOX(
          this.options.url,
          this.options.type,
          'query',
          requestProjectionCode,
          proj,
          mapExtent,
          this.options.limit,
          this.options.version,
          this.options.outputFormat,
          this.options.swapX
        )
          .then((features) => this.addFeatures(features))
          .catch(onError);
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
      this.options.url,
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
      this.options.url,
      this.options.type,
      request,
      this.options.version,
      this.options.outputFormat,
      this.options.swapX
    ).then((featureTypeResponse: IQueryFeatureTypeResponse) => {
      return {
        request,
        featureTypeResponses: [featureTypeResponse],
      };
    });
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    return retrieveWfsFeature(
      this.options.url,
      this.options.type,
      id,
      projection,
      this.options.version,
      this.options.outputFormat,
      this.options.swapX
    );
  }
}
