import OlImageWMS from 'ol/source/ImageWMS';
import { IGisRequest, IQueryResponse, IExtended, ILayerLegend, IFetchLegendOptions } from './IExtended';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { Options } from 'ol/source/ImageWMS';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import ImageWrapper from 'ol/Image';
import { IPredicate } from '../filter/predicate';
import { imageLoadWithHttpEngineFunction } from '../utils/image-load-function.utils';
import {
  ICommonWmsOptions,
  WMSFetchLegend,
  WMSGetTypePredicateAsMap,
  WMSHandlePropertyChange,
  WMSInit,
  WMSInitializeOptions,
  WMSLoadFunction,
  WMSQuery,
  WMSRetrieveFeature,
  WMSSetSourceOptions,
} from './common/wms';

export interface IImageWmsOptions extends ICommonWmsOptions, Omit<Options, 'url'> {}

export class ImageWms extends OlImageWMS implements IExtended {
  protected options: Required<IImageWmsOptions>;

  protected legendByLayer: Record<string, ILayerLegend[]>;

  protected defaultTypePredicateAsMap: Map<string, IPredicate>;

  private defaultImageLoadFunction: WMSLoadFunction<ImageWrapper> | undefined;

  constructor(options: IImageWmsOptions) {
    super({ crossOrigin: 'anonymous', ...options });

    this.legendByLayer = {};

    this.options = WMSInitializeOptions(options);

    this.defaultTypePredicateAsMap = WMSGetTypePredicateAsMap(this.options.types);

    this.setSourceOptions(this.options);
  }

  public init(): Promise<void> {
    return WMSInit(this.options, this);
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.ImageWms;
  }

  public getSourceOptions(): IImageWmsOptions {
    return this.options;
  }

  public setSourceOptions(options: IImageWmsOptions, forceRefresh = true): void {
    WMSSetSourceOptions<IImageWmsOptions, ImageWrapper>(
      options,
      this,
      this.getLoadFunction.bind(this),
      this.setLoadFunction.bind(this),
      imageLoadWithHttpEngineFunction,
      this.defaultImageLoadFunction,
      this.defaultTypePredicateAsMap,
      this.getParams(),
      this.handlePropertychange,
    );
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
    return WMSQuery(this, request, this.options, onlyVisible);
  }

  public refresh(): void {
    this.updateParams({ ...this.getParams(), NOW: Date.now() });
    super.refresh();
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    return WMSRetrieveFeature(id, projection, this.options);
  }

  private handlePropertychange = (event: any) => {
    WMSHandlePropertyChange(event, this.options, this);
  };

  public async fetchLegend(options?: IFetchLegendOptions): Promise<Record<string, ILayerLegend[]>> {
    return WMSFetchLegend(this.legendByLayer, this, this.options, options);
  }

  private getLoadFunction(): WMSLoadFunction<ImageWrapper> {
    return this.getImageLoadFunction();
  }

  private setLoadFunction(loadFunction: WMSLoadFunction<ImageWrapper>): void {
    this.setImageLoadFunction(loadFunction);
  }
}
