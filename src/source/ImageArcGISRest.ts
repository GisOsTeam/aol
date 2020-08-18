import OlImageArcGISRest, { Options } from 'ol/source/ImageArcGISRest';
import {
  IExtended,
  IFeatureType,
  ILayerLegend,
  IQueryFeatureTypeResponse,
  IQueryRequest,
  IQueryResponse,
  ISnapshotOptions,
} from './IExtended';
import { getAgsLayersFromTypes } from '../utils';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import { executeAgsQuery, loadAgsFeatureDescription, retrieveAgsFeature } from './query';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { FilterBuilder, FilterBuilderTypeEnum } from '../filter';

export interface IImageArcGISRestOptions extends ISnapshotOptions, Options {
  types: IFeatureType<number>[];
}

export class ImageArcGISRest extends OlImageArcGISRest implements IExtended {
  protected options: IImageArcGISRestOptions;
  protected legendByLayer: Record<string, ILayerLegend[]>;
  protected defaultTypes: Map<number, IFeatureType<number>>;

  constructor(options: IImageArcGISRestOptions) {
    super({ ...options });
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }

    this.defaultTypes = new Map<number, IFeatureType<number>>();

    this.setSourceOptions(this.options);

    if (this.options.types) {
      for (const type of this.options.types) {
        if (!this.defaultTypes.has(type.id)) {
          this.defaultTypes.set(type.id, type);
        }
      }
    }
  }

  public async init(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const type of this.options.types) {
      promises.push(loadAgsFeatureDescription(this, type));
    }

    return Promise.all([promises, this.fetchLegend()]).then(() => {
      this.setSourceOptions(this.options);
      return;
    });
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.ImageArcGISRest;
  }

  public getSourceOptions(): IImageArcGISRestOptions {
    return this.options;
  }

  public setSourceOptions(options: IImageArcGISRestOptions): void {
    this.options = { ...options };
    this.un('propertychange', this.handlePropertychange);
    this.set('types', options.types);
    const params = { ...this.getParams(), LAYERS: getAgsLayersFromTypes(options.types) };

    let layerDefsAsObject: any;
    for (const type of options.types) {
      let filterBuilder = this.buildFilterBuilderFromType_(type);
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

  public async getLegend() {
    return await this.legendByLayer;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    const promises: Promise<IQueryFeatureTypeResponse>[] = [];
    for (const type of this.options.types) {
      let filterBuilder = this.buildFilterBuilderFromType_(type);
      if (request.filters) {
        filterBuilder = filterBuilder ? filterBuilder.and(request.filters) : new FilterBuilder(request.filters);
      }
      promises.push(executeAgsQuery(this, type, request));
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

  private handlePropertychange = (event: any) => {
    const key = event.key;
    const value = event.target.get(key);
    if (key === 'types') {
      this.updateParams({ ...this.getParams(), LAYERS: getAgsLayersFromTypes(value) });
      this.options.types = value;
    }
  };

  async fetchLegend() {
    if (this.legendByLayer) {
      return this.legendByLayer;
    }

    const resp = await fetch(`${this.options.url}/legend?f=json`);
    const legendResp = await resp.json();

    this.legendByLayer = {};
    const displayedLayers = this.options.types.map((type) => type.id);
    legendResp.layers.forEach((layer: any) => {
      if (displayedLayers.indexOf(layer.layerId) >= 0) {
        this.legendByLayer[layer.layerId] = layer.legend.map(
          (legend: any): ILayerLegend => ({
            srcImage: `data:image/png;base64, ${legend.imageData}`,
            label: legend.label || layer.layerName,
          })
        );
      }
    });

    return this.legendByLayer;
  }

  private buildFilterBuilderFromType_(type: IFeatureType<number>): FilterBuilder | undefined {
    let filterBuilder;
    if (this.defaultTypes.has(type.id) && this.defaultTypes.get(type.id).predicate) {
      filterBuilder = new FilterBuilder(this.defaultTypes.get(type.id).predicate);
    }
    if (type.predicate) {
      filterBuilder = filterBuilder ? filterBuilder.and(type.predicate) : new FilterBuilder(type.predicate);
    }
    return filterBuilder;
  }
}
