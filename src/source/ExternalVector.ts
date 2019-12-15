import { Vector } from './Vector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export class ExternalVector extends Vector {
  protected options: any;

  constructor(options: any = {}) {
    super({ ...options, useSpatialIndex: false });
    this.options = options;
  }

  public getSourceTypeName(): SourceType {
    return SourceTypeEnum.ExternalVector;
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
