import { Wmts } from '../Wmts';
import { optionsFromCapabilities } from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import { IWmtsCapabilitiesOptions } from '../WmtsCapabilities';

const parser = new WMTSCapabilities();

export class WmtsFactory {
  public static create(source: Document | Element | string, wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions): Wmts {
    const config: any = {};
    if (wmtsCapabilitiesOptions.layer) {
      config.layer = wmtsCapabilitiesOptions.layer;
    }
    if (wmtsCapabilitiesOptions.matrixSet) {
      config.matrixSet = wmtsCapabilitiesOptions.matrixSet;
    }
    if (wmtsCapabilitiesOptions.crossOrigin) {
      config.crossOrigin = wmtsCapabilitiesOptions.crossOrigin;
    }
    if (wmtsCapabilitiesOptions.projection) {
      config.projection = wmtsCapabilitiesOptions.projection;
    }
    const options = optionsFromCapabilities(parser.read(source), config);
    return new Wmts(options);
  }
}
