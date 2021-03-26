import OlImageArcGISRest, { Options } from 'ol/source/ImageArcGISRest';
import {
  IExtended,
  IFeatureType,
  ILayerLegend,
  IQueryFeatureTypeResponse,
  IGisRequest,
  IQueryResponse,
  ISnapshotOptions,
} from './IExtended';
import { getAgsLayersFromTypes } from '../utils';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import { executeAgsQuery, loadAgsFeatureDescription, retrieveAgsFeature } from './query';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { FilterBuilder, FilterBuilderTypeEnum } from '../filter';
import { IPredicate } from '../filter/predicate';
import { loadLegendAgs } from './legend/ags';

export interface IImageArcGISRestOptions extends ISnapshotOptions, Options {
  types: IFeatureType<number>[];

  layersPrefix?: 'all' | 'top' | 'visible';
}

export class ImageArcGISRest extends OlImageArcGISRest implements IExtended {
  protected options: IImageArcGISRestOptions;
  protected legendByLayer: Record<string, ILayerLegend[]>;
  protected defaultTypePredicateAsMap: Map<number, IPredicate>;

  constructor(options: IImageArcGISRestOptions) {
    super({ crossOrigin: 'anonymous', ...options });
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
    if (this.options.removable != false) {
      this.options.removable = true;
    }

    this.defaultTypePredicateAsMap = new Map<number, IPredicate>();

    this.setSourceOptions(this.options);

    if (this.options.types) {
      for (const type of this.options.types) {
        if (!this.defaultTypePredicateAsMap.has(type.id) && type.predicate) {
          this.defaultTypePredicateAsMap.set(type.id, type.predicate);
        }
      }
    }
  }

  public init(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const type of this.options.types) {
      promises.push(loadAgsFeatureDescription(this, type));
    }

    return Promise.all(promises).then(() => {
      return;
    });
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.ImageArcGISRest;
  }

  public getSourceOptions(): IImageArcGISRestOptions {
    return this.options;
  }

  public refresh(): void {
    this.updateParams({ ...this.getParams(), NOW: Date.now() });
    super.refresh();
  }

  public setSourceOptions(options: IImageArcGISRestOptions): void {
    this.options = { ...options };
    this.un('propertychange', this.handlePropertychange);
    this.set('types', options.types);
    const params = {
      ...this.getParams(),
      LAYERS: getAgsLayersFromTypes(options.types, options.layersPrefix),
      NOW: Date.now()
    };

    let layerDefsAsObject: any;
    for (const type of options.types) {
      let filterBuilder = this.buildFilterBuilderFromType(type);
      if (filterBuilder) {
        if (!layerDefsAsObject) {
          layerDefsAsObject = {};
        }
        layerDefsAsObject[type.id] = filterBuilder.build(FilterBuilderTypeEnum.SQL);
        filterBuilder = undefined;
      }
    }
    if (layerDefsAsObject) {
      params.LAYERDEFS = JSON.stringify(layerDefsAsObject);
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
        this.alterRequestFilterFromType(request, type);
        promises.push(executeAgsQuery(this, type, request));
      }
    }
    return Promise.all(promises).then((featureTypeResponses: IQueryFeatureTypeResponse[]) => {
      return {
        request,
        featureTypeResponses,
      };
    });
  }

  public async queryLayer(request: IGisRequest, layerId: number): Promise<IQueryResponse> {
    const layer = this.options.types.find((subLayer) => subLayer.id === layerId);
    if (layer) {
      this.alterRequestFilterFromType(request, layer);

      const featureTypeResponse = await executeAgsQuery(this, layer, request);
      return {
        featureTypeResponses: [featureTypeResponse],
        request,
      };
    } else {
      console.warn(`Unable to find ${layerId} in this source`);
    }
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    const promises: Promise<Feature>[] = [];
    for (const type of this.options.types) {
      promises.push(retrieveAgsFeature(this, type, id, projection));
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

  public fetchLegend(options: { refresh: boolean } = { refresh: false }): Promise<Record<string, ILayerLegend[]>> {
    if (this.legendByLayer && options.refresh == false) {
      return Promise.resolve(this.legendByLayer);
    }
    return loadLegendAgs(this).then((res) => {
      this.legendByLayer = res;
      return res;
    });
  }

  private handlePropertychange = (event: any) => {
    const key = event.key;
    const value = event.target.get(key);
    if (key === 'types') {
      this.updateParams({ ...this.getParams(), LAYERS: getAgsLayersFromTypes(value, this.options.layersPrefix) });
      this.options.types = value;
    }
  };

  private buildFilterBuilderFromType(type: IFeatureType<number>): FilterBuilder | undefined {
    let filterBuilder;
    if (this.defaultTypePredicateAsMap.has(type.id)) {
      filterBuilder = new FilterBuilder(this.defaultTypePredicateAsMap.get(type.id));
    }
    if (type.predicate) {
      filterBuilder = filterBuilder ? filterBuilder.and(type.predicate) : new FilterBuilder(type.predicate);
    }
    return filterBuilder;
  }

  private alterRequestFilterFromType(request: IGisRequest, type: IFeatureType<number>) {
    let filterBuilder = this.buildFilterBuilderFromType(type);
    if (request.filters) {
      filterBuilder = filterBuilder ? filterBuilder.and(request.filters) : new FilterBuilder(request.filters);
    }
    if (filterBuilder) {
      return filterBuilder.predicate;
    }
    return;
  }
}
