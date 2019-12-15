import { IExtended } from './IExtended';
import { Options } from 'ol/source/Vector';

export interface IVectorOptions extends Options {
  snapshotable?: boolean;
  listable?: boolean;
}

export interface IVector extends IExtended {
}
