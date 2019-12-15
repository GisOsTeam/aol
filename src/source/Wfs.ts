import OlGeoJSON from 'ol/format/GeoJSON';
import Projection from 'ol/proj/Projection';
import { ExternalVector } from './ExternalVector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export class Wfs extends ExternalVector {
  protected options: any;

  constructor(options: any = {}) {
    super({
      ...options,
      format: new OlGeoJSON(),
      url: (extent: [number, number, number, number], projection: Projection) => {
        return `${this.getUrl()}?service=WFS&version=1.1.0&request=GetFeature&typename=${
          this.options.type.id
        }&outputFormat=application/json&srsname=${projection.getCode()}&bbox=${extent.join(
          ','
        )},${projection.getCode()}`;
      }
    });
    this.options = options;
  }

  public getSourceTypeName(): SourceType {
    return SourceTypeEnum.Wfs;
  }

  public getSourceOptions(): any {
    return this.options;
  }

  public getLayerTypeName(): LayerType {
    return LayerTypeEnum.Vector;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }
}
