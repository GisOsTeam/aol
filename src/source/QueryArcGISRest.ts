import OlEsriJSON from 'ol/format/EsriJSON';
import { send, IResponse } from 'bhreq';
import { ExternalVector } from './ExternalVector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { IExtendedOptions } from './IExtended';

export class QueryArcGISRest extends ExternalVector {
  protected options: any;

  private esriJSONFormat = new OlEsriJSON();

  constructor(options: IExtendedOptions = {}) {
    super({ ...options });
    this.options = { ...options };
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.QueryArcGISRest;
  }

  public getSourceOptions(): IExtendedOptions {
    return this.options;
  }

  public setSourceOptions(options: IExtendedOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Vector;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
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
    return send({ url, contentType: 'application/json' }).then(
      (response: IResponse) => this.esriJSONFormat.readFeatures(response.body),
      () => {
        console.error(`Request error ${url}`);
      }
    );
  }
}
