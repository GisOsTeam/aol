import OlImageWMS from 'ol/source/ImageWMS';
import {
  IQueryFeatureTypeResponse,
  IGisRequest,
  IQueryResponse,
  ISnapshotOptions,
  FeatureType,
  IExtended,
  ILayerLegend,
} from './IExtended';
import { getWmsLayersFromTypes } from '../utils';
import { executeWmsQuery, retrieveWmsFeature, loadWmsFeatureDescription } from './query/wms';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { Options } from 'ol/source/ImageWMS';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { loadLegendWms } from './legend/wms';
import { executeWfsQuery, loadWfsFeatureDescription, retrieveWfsFeature } from './query';
import { FilterBuilder, FilterBuilderTypeEnum } from '../filter';
import { IPredicate } from '../filter/predicate';

export interface IImageWMSOptions extends ISnapshotOptions, Options {
  types: FeatureType<string>[];
  queryWfsUrl?: string; // For Wfs query instead of Wms query
  queryMethod?: 'GET' | 'POST';
  queryFormat?: string;
  requestProjectionCode?: string;
  version?: '1.0.0' | '1.1.0' | '1.3.0';
  swapXYBBOXRequest?: boolean;
  swapLonLatGeometryResult?: boolean;
  limit?: number;
}

export class ImageWms extends OlImageWMS implements IExtended {
  protected options: IImageWMSOptions;
  private readonly defaultOptions: Pick<
    IImageWMSOptions,
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

  protected defaultTypePredicateAsMap: Map<string, IPredicate>;

  constructor(options: IImageWMSOptions) {
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

    this.defaultTypePredicateAsMap = new Map<string, IPredicate>();

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
    return SourceTypeEnum.ImageWms;
  }

  public getSourceOptions(): IImageWMSOptions {
    return this.options;
  }

  public setSourceOptions(options: IImageWMSOptions, forceRefresh = true): void {
    this.options = { ...this.defaultOptions, ...options };
    this.un('propertychange', this.handlePropertychange);
    this.set('types', options.types);

    const params = {
      ...this.getParams(),
      TRANSPARENT: 'TRUE',
      LAYERS: getWmsLayersFromTypes(options.types),
      VERSION: this.options.version,
      NOW: Date.now(),
    };
    const cqlFilter = this.buildFilters();
    if (cqlFilter) {
      params.CQL_FILTER = cqlFilter;
    }

    this.updateParams(params);
    this.on('propertychange', this.handlePropertychange);
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Image;
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

  public refresh(): void {
    this.updateParams({ ...this.getParams(), NOW: Date.now() });
    super.refresh();
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
      this.updateParams({
        ...this.getParams(),
        TRANSPARENT: 'TRUE',
        LAYERS: getWmsLayersFromTypes(value),
        VERSION: this.options.version,
      });
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

  private buildFilters(): string {
    let filters: string;
    for (const type of this.options.types) {
      let filterBuilder = this.buildFilterBuilderFromType(type);
      if (filterBuilder) {
        if (!filters) {
          filters = '';
        } else {
          filters += ';';
        }
        filters += filterBuilder.build(FilterBuilderTypeEnum.CQL);
        filterBuilder = undefined;
      }
    }
    return filters;
  }

  private buildFilterBuilderFromType(type: FeatureType<string>): FilterBuilder | undefined {
    let filterBuilder;
    if (this.defaultTypePredicateAsMap.has(type.id)) {
      filterBuilder = new FilterBuilder(this.defaultTypePredicateAsMap.get(type.id));
    } else if (type.predicate) {
      this.defaultTypePredicateAsMap.set(type.id, type.predicate);
    }
    if (type.predicate && filterBuilder?.predicate.hashCode() !== type.predicate.hashCode()) {
      filterBuilder = filterBuilder ? filterBuilder.and(type.predicate) : new FilterBuilder(type.predicate);
    }
    return filterBuilder;
  }
}
