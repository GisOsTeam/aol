import { Wmts, WmtsSnapshotOptions } from '../Wmts';
import { optionsFromCapabilities } from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';

const parser = new WMTSCapabilities();

export class WmtsFactory {
  public static create(source: Document | Element | string, wmtsSnapshotOptions: WmtsSnapshotOptions): Wmts {
    return new Wmts({
      ...optionsFromCapabilities(parser.read(source), wmtsSnapshotOptions),
      ...wmtsSnapshotOptions,
    });
  }
}
