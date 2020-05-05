import OlImageArcGISRest from 'ol/source/ImageArcGISRest';
import {
  IQueryRequest,
  IQueryResponse,
  IExtendedOptions,
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

export interface IImageArcGISRestOptions extends IExtendedOptions, Options {
  types: IFeatureType<number>[];
}

export class ImageArcGISRest extends OlImageArcGISRest implements IExtended {
  protected options: IImageArcGISRestOptions;

  constructor(options: IImageArcGISRestOptions) {
    super({ ...options } as any);
    this.options = { ...options };
    this.setSourceOptions(this.options);
  }

  public init(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const type of this.options.types) {
      promises.push(loadAgsFeatureDescription(this, type));
    }
    return Promise.all(promises).then(() => {
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

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
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
}
