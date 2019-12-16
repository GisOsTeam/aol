import OlTileWMS from 'ol/source/TileWMS';
import { IQueryRequest, IQueryResponse, IQueryFeatureTypeResponse, IExtendedOptions, IFeatureType } from './IExtended';
import { ITileImage } from './ITileImage';
import { getLayersFromTypes } from '../utils';
import { wmsQueryOne } from './query/wmsQuery';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/TileWMS';

export interface ITileWmsOptions extends IExtendedOptions, Options {
  types: Array<IFeatureType<string>>;
}

export class TileWms extends OlTileWMS implements ITileImage {
  protected options: ITileWmsOptions;

  constructor(options: ITileWmsOptions) {
    super({ ...options });
    this.options = { ...options };
    this.set('types', options.types);
    this.updateParams({ ...this.getParams(), LAYERS: getLayersFromTypes(options.types) });
    this.on('propertychange', this.handlePropertychange);
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
    this.updateParams({ ...this.getParams(), LAYERS: getLayersFromTypes(options.types) });
    this.on('propertychange', this.handlePropertychange);
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Tile;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    const promises: Array<Promise<IQueryFeatureTypeResponse>> = [];
    for (const type of this.options.types) {
      promises.push(wmsQueryOne(this.getUrls()[0], type, request));
    }
    return Promise.all(promises).then((featureTypeResponses: IQueryFeatureTypeResponse[]) => {
      return {
        request,
        featureTypeResponses
      };
    });
  }

  private handlePropertychange = (event: any) => {
    const key = event.key;
    const value = event.target.get(key);
    if (key === 'types') {
      this.updateParams({ ...this.getParams(), LAYERS: getLayersFromTypes(value) });
      this.options.types = value;
    }
  };
}
