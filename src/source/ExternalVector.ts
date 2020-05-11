import { Vector, IVectorOptions } from './Vector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export interface IExternalVectorOptions extends IVectorOptions {}

export class ExternalVector extends Vector {
  constructor(options: IExternalVectorOptions) {
    super({ ...options, useSpatialIndex: false });
    this.options = options;
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
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
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }
}
