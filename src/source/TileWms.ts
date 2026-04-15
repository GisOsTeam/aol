import OlTileWMS from 'ol/source/TileWMS';
import { IGisRequest, IQueryResponse, IExtended, ILayerLegend, IFetchLegendOptions } from './IExtended';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { Options } from 'ol/source/TileWMS';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { IPredicate } from '../filter/predicate';
import { tileLoadWithHttpEngineFunction } from '../utils/image-load-function.utils';
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
import { Tile } from 'ol';

export interface ITileWmsOptions extends ICommonWmsOptions, Omit<Options, 'url'> {}

export class TileWms extends OlTileWMS implements IExtended {
  protected options: Required<ITileWmsOptions>;

  protected legendByLayer: Record<string, ILayerLegend[]>;

  protected defaultTypePredicateAsMap: Map<string, IPredicate>;

  private defaultTileLoadFunction: WMSLoadFunction<Tile> | undefined;

  constructor(options: ITileWmsOptions) {
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
    return SourceTypeEnum.TileWms;
  }

  public getSourceOptions(): ITileWmsOptions {
    return this.options;
  }

  public setSourceOptions(options: ITileWmsOptions): void {
    WMSSetSourceOptions<ITileWmsOptions, Tile>(
      options,
      this,
      this.getLoadFunction.bind(this),
      this.setLoadFunction.bind(this),
      tileLoadWithHttpEngineFunction,
      this.defaultTileLoadFunction,
      this.defaultTypePredicateAsMap,
      this.getParams(),
      this.handlePropertychange,
    );
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

  private getLoadFunction(): WMSLoadFunction<Tile> {
    return this.getTileLoadFunction();
  }

  private setLoadFunction(loadFunction: WMSLoadFunction<Tile>): void {
    this.setTileLoadFunction(loadFunction);
  }
}
