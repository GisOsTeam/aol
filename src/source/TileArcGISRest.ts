import OlTileArcGISRest from 'ol/source/TileArcGISRest';
import { ISnapshotOptions, ISnapshotSource } from './IExtended';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { Options } from 'ol/source/TileArcGISRest';

export interface ITileArcGISRestOptions extends ISnapshotOptions, Options {}

export class TileArcGISRest extends OlTileArcGISRest implements ISnapshotSource {
  protected options: any;

  constructor(options: ITileArcGISRestOptions) {
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
    return SourceTypeEnum.TileArcGISRest;
  }

  public getSourceOptions(): ITileArcGISRestOptions {
    return this.options;
  }

  public setSourceOptions(options: ITileArcGISRestOptions): void {
    this.options = { ...options };
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
}
