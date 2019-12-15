import { IExtended } from './IExtended';
import { Options } from 'ol/source/VectorTile';

export interface IVectorTileOptions extends Options {
  snapshotable?: boolean;
  listable?: boolean;
}

export interface IVectorTile extends IExtended {}
