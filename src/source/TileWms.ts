import OlTileWMS from 'ol/source/TileWMS';
import {
  IGisRequest,
  IQueryResponse,
  IQueryFeatureTypeResponse,
  ISnapshotOptions,
  IFeatureType,
  IExtended,
  ILayerLegend,
} from './IExtended';
import { getWmsLayersFromTypes } from '../utils';
import { executeWmsQuery, retrieveWmsFeature, loadWmsFeatureDescription } from './query/wms';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/TileWMS';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { loadLegendWms } from './legend/wms';
import { executeWfsQuery, loadWfsFeatureDescription, retrieveWfsFeature } from './query';

export interface ITileWmsOptions extends ISnapshotOptions, Options {
  types: IFeatureType<string>[];
  queryWfsUrl?: string; // For Wfs query instead of Wms query
  queryMethod?: 'GET' | 'POST';
  queryFormat?: string;
  requestProjectionCode?: string;
  version?: '1.0.0' | '1.1.0' | '1.3.0';
  swapXYBBOXRequest?: boolean;
  swapLonLatGeometryResult?: boolean;
  limit?: number;
}

export class TileWms extends OlTileWMS implements IExtended {
  protected options: ITileWmsOptions;
  private readonly defaultOptions: Pick<
    ITileWmsOptions,
    | 'queryMethod'
    | 'queryFormat'
    | 'version'
    | 'requestProjectionCode'
    | 'swapXYBBOXRequest'
    | 'swapLonLatGeometryResult'
    | 'limit'
  > = {
    queryMethod: 'GET',
    queryFormat: 'text/xml; subtype=gml/3.1.1', // 'application/json',
    version: '1.3.0',
    requestProjectionCode: 'EPSG:3857',
    swapXYBBOXRequest: false,
    swapLonLatGeometryResult: false,
    limit: 10000,
  };
  protected legendByLayer: Record<string, ILayerLegend[]>;

  constructor(options: ITileWmsOptions) {
    super({ crossOrigin: 'anonymous', ...options });
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
    this.setSourceOptions(this.options);
  }

  public init(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const type of this.options.types) {
      if (this.options.queryWfsUrl != null) {
        promises.push(
          loadWfsFeatureDescription({
            url: this.options.queryWfsUrl,
            type,
            version: '1.1.0', // Do not use version option !
            outputFormat: this.options.queryFormat,
            requestProjectionCode: this.options.requestProjectionCode,
          })
        );
      } else {
        promises.push(
          loadWmsFeatureDescription({
            url: 'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
            type,
            method: this.options.queryMethod,
            version: this.options.version,
            outputFormat: this.options.queryFormat,
            requestProjectionCode: this.options.requestProjectionCode,
          })
        );
      }
    }

    return Promise.all(promises).then(() => {
      this.setSourceOptions(this.options);
      return;
    });
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.TileWms;
  }

  public getSourceOptions(): ITileWmsOptions {
    return this.options;
  }

  public setSourceOptions(options: ITileWmsOptions): void {
    this.options = { ...options };
    this.un('propertychange', this.handlePropertychange);
    this.set('types', options.types);
    this.updateParams({ ...this.getParams(), TRANSPARENT: 'TRUE', LAYERS: getWmsLayersFromTypes(options.types) });
    this.on('propertychange', this.handlePropertychange);
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Tile;
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
    const promises: Promise<IQueryFeatureTypeResponse>[] = [];
    for (const type of this.options.types) {
      const isVisible = type.hide !== true;
      if (!onlyVisible || isVisible) {
        if (this.options.queryWfsUrl != null) {
          promises.push(
            executeWfsQuery({
              source: this,
              url: this.options.queryWfsUrl,
              type,
              request,
              requestProjectionCode: this.options.requestProjectionCode,
              version: '1.1.0', // Do not use version option !
              outputFormat: this.options.queryFormat,
              swapXYBBOXRequest: this.options.swapXYBBOXRequest,
              swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
            })
          );
        } else {
          promises.push(
            executeWmsQuery({
              source: this,
              url: 'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
              type,
              request,
              method: this.options.queryMethod,
              requestProjectionCode: this.options.requestProjectionCode,
              version: this.options.version,
              outputFormat: this.options.queryFormat,
              swapXYBBOXRequest: this.options.swapXYBBOXRequest,
              swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
            })
          );
        }
      }
    }
    return Promise.all(promises).then((featureTypeResponses: IQueryFeatureTypeResponse[]) => {
      return {
        request,
        featureTypeResponses,
      };
    });
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    const promises: Promise<Feature>[] = [];
    for (const type of this.options.types) {
      if (this.options.queryWfsUrl != null) {
        promises.push(
          retrieveWfsFeature({
            url: this.options.queryWfsUrl,
            type,
            id,
            requestProjectionCode: this.options.requestProjectionCode,
            featureProjection: projection,
            version: '1.1.0', // Do not use version option !
            outputFormat: this.options.queryFormat,
            swapXYBBOXRequest: this.options.swapXYBBOXRequest,
            swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
          })
        );
      } else {
        promises.push(
          retrieveWmsFeature({
            url: 'getUrl' in this ? (this as any).getUrl() : (this as any).getUrls()[0],
            type,
            id,
            requestProjectionCode: this.options.requestProjectionCode,
            featureProjection: projection,
            method: this.options.queryMethod,
            version: this.options.version,
            outputFormat: this.options.queryFormat,
            swapLonLatGeometryResult: this.options.swapLonLatGeometryResult,
          })
        );
      }
    }
    let feature: Feature = null;
    Promise.all(promises).then((features: Feature[]) => {
      features.forEach((currentFeature) => {
        if (currentFeature) {
          feature = currentFeature;
        }
      });
    });
    return Promise.resolve(feature);
  }

  private handlePropertychange = (event: any) => {
    const key = event.key;
    const value = event.target.get(key);
    if (key === 'types') {
      this.updateParams({ ...this.getParams(), TRANSPARENT: 'TRUE', LAYERS: getWmsLayersFromTypes(value) });
      this.options.types = value;
    }
  };

  public fetchLegend(options: { refresh: boolean } = { refresh: false }): Promise<Record<string, ILayerLegend[]>> {
    if (this.legendByLayer && options.refresh == false) {
      return Promise.resolve(this.legendByLayer);
    }
    return loadLegendWms(this).then((res) => {
      this.legendByLayer = res;
      return res;
    });
  }
}
