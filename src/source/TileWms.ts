import OlTileWMS from 'ol/source/TileWMS';
import { IQueryRequest, IQueryResponse, IQueryFeatureTypeResponse } from './IExtended';
import { ITileImage } from './ITileImage';
import { getLayersFromTypes } from '../utils';
import { wmsQueryOne } from './query/wmsQuery';

export class TileWms extends OlTileWMS implements ITileImage {
  protected options: any;

  constructor(options: any = {}) {
    super({ ...options });
    this.options = options;
    this.set('types', options.types);
    this.updateParams({ ...this.getParams(), LAYERS: getLayersFromTypes(options.types) });
    this.on('propertychange', this.handlePropertychange);
  }

  public getSourceTypeName(): string {
    return 'TileWms';
  }

  public getSourceOptions(): any {
    return this.options;
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
