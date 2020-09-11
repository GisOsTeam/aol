import OlImageWMS from 'ol/source/ImageWMS';
import {
  IQueryFeatureTypeResponse,
  IQueryRequest,
  IQueryResponse,
  ISnapshotOptions,
  IFeatureType,
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

export interface IImageWMSOptions extends ISnapshotOptions, Options {
  types: IFeatureType<string>[];
}

export class ImageWms extends OlImageWMS implements IExtended {
  protected options: IImageWMSOptions;
  protected legendByLayer: Record<string, ILayerLegend[]>;

  constructor(options: IImageWMSOptions) {
    super({ crossOrigin: 'anonymous', ...options });
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
    this.setSourceOptions(this.options);
  }

  public init(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const type of this.options.types) {
      promises.push(loadWmsFeatureDescription(this, type));
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

  public setSourceOptions(options: IImageWMSOptions): void {
    this.options = { ...options };
    this.un('propertychange', this.handlePropertychange);
    this.set('types', options.types);
    this.updateParams({ ...this.getParams(), LAYERS: getWmsLayersFromTypes(options.types) });
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

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    const promises: Promise<IQueryFeatureTypeResponse>[] = [];
    for (const type of this.options.types) {
      promises.push(executeWmsQuery(this, type, request));
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
      promises.push(retrieveWmsFeature(this, type, id, projection));
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
      this.updateParams({ ...this.getParams(), LAYERS: getWmsLayersFromTypes(value) });
      this.options.types = value;
    }
  };

  public fetchLegend(options: { refresh: boolean } = { refresh: false }): Promise<Record<string, ILayerLegend[]>> {
    if (this.legendByLayer && options.refresh == false) {
      return Promise.resolve(this.legendByLayer);
    }

    this.legendByLayer = {
      0: [{ srcImage: this.getLegendUrl(undefined, { TRANSPARENT: true, SLD_VERSION: '1.1.0' }) }],
    };
    return Promise.resolve(this.legendByLayer);
  }
}
