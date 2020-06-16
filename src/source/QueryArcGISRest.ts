import OlEsriJSON from 'ol/format/EsriJSON';
import { IResponse } from 'bhreq';
import { ExternalVector } from './ExternalVector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { ISnapshotOptions } from './IExtended';
import { Options } from 'ol/source/Vector';
import { HttpEngine } from '../HttpInterceptor';

export interface IQueryArcGISRestOptions extends ISnapshotOptions, Options {}

export class QueryArcGISRest extends ExternalVector {
  protected options: any;

  private esriJSONFormat = new OlEsriJSON();

  constructor(options: IQueryArcGISRestOptions) {
    super({ ...options });
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.QueryArcGISRest;
  }

  public getSourceOptions(): IQueryArcGISRestOptions {
    return this.options;
  }

  public setSourceOptions(options: IQueryArcGISRestOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Vector;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }

  public load(extent: [number, number, number, number], projectionCode: string) {
    const srid = projectionCode.split(':').pop();
    const geometry = encodeURIComponent(
      `{"xmin":${extent[0]},"ymin":${extent[1]},"xmax":${extent[2]},"ymax":${extent[3]},"spatialReference":{"wkid":${srid}}}`
    );
    let url = `${this.getUrl()}/query/?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=${geometry}&geometryType=esriGeometryEnvelope&inSR=${srid}&outFields=*&outSR=${srid}`;
    if (this.options.where) {
      url += `&where=${this.options.where}`;
    }
    return HttpEngine.getInstance()
      .send({ url, contentType: 'application/json' })
      .then(
        (response: IResponse) => this.esriJSONFormat.readFeatures(response.body),
        () => {
          console.error(`Request error ${url}`);
        }
      );
  }
}
