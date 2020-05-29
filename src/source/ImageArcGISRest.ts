import OlImageArcGISRest from 'ol/source/ImageArcGISRest';
import {
  IQueryRequest,
  IQueryResponse,
  ISnapshotOptions,
  IQueryFeatureTypeResponse,
  IFeatureType,
  IExtended,
} from './IExtended';
import { getAgsLayersFromTypes } from '../utils';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { executeAgsQuery, retrieveAgsFeature, loadAgsFeatureDescription } from './query/ags';
import { Options } from 'ol/source/ImageArcGISRest';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { ILayerLegend } from './ILayerLegend';
import { IHasLegend } from './IHasLegend';

export interface IImageArcGISRestOptions extends ISnapshotOptions, Options {
  types: IFeatureType<number>[];
}

export class ImageArcGISRest extends OlImageArcGISRest implements IExtended, IHasLegend {
  protected options: IImageArcGISRestOptions;
  public legendByLayer: Record<string, ILayerLegend[]>;

  constructor(options: IImageArcGISRestOptions) {
    super({ ...options } as any);
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
    this.setSourceOptions(this.options);
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
    this.updateParams({ ...this.getParams(), LAYERS: getAgsLayersFromTypes(options.types) });
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
        this.legendByLayer[layer.layerId] = layer.legend.map((legend: any): ILayerLegend => ({
          srcImage: `data:image/png;base64, ${legend.imageData}`,
          label: legend.label || layer.layerName
        }));
      }
    });

    return this.legendByLayer;
  }
}
