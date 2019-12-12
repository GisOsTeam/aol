import { Vector } from './Vector';

export class ExternalVector extends Vector {
  protected options: any;

  constructor(options: any = {}) {
    super({ ...options, useSpatialIndex: false });
    this.options = options;
  }

  public getSourceTypeName(): string {
    return 'ExternalVector';
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
}
