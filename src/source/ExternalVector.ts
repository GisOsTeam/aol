import { Vector, IVectorOptions } from './Vector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export interface IExternalVectorOptions extends IVectorOptions {}

export class ExternalVector extends Vector {
  constructor(options: IExternalVectorOptions) {
    super({ ...options, useSpatialIndex: false });
    this.options = options;
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.ExternalVector;
  }

  public getSourceOptions(): IExternalVectorOptions {
    return this.options;
  }

  public setSourceOptions(options: IExternalVectorOptions): void {
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
}
