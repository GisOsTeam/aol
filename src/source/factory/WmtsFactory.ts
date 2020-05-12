import { Wmts } from '../Wmts';
import { optionsFromCapabilities } from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import { IWmtsCapabilitiesOptions } from '../WmtsCapabilities';

const parser = new WMTSCapabilities();

export class WmtsFactory {
  public static create(source: Document | Element | string, wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions): Wmts {
    return new Wmts({
      ...optionsFromCapabilities(parser.read(source), wmtsCapabilitiesOptions),
      ...wmtsCapabilitiesOptions,
    });
  }
}
