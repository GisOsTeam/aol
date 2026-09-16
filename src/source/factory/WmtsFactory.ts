import { Wmts, IWmtsOptions } from '../Wmts';
import { optionsFromCapabilities, Options } from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';

const parser = new WMTSCapabilities();

export class WmtsFactory {
  public static create(source: Document | Element | string, wmtsOptions: Partial<IWmtsOptions>): Wmts {
    const config: Partial<Options> = { ...wmtsOptions, url: undefined }; // On enlène l'url car elle provient de la source
    const options = optionsFromCapabilities(parser.read(source), config);
    if (options == null) {
      throw new Error('Unable to process options from capabilities');
    }
    const merdgedOptions = {
      ...wmtsOptions,
      ...options,
    };
    if (wmtsOptions.url) {
      merdgedOptions.urls = [`${wmtsOptions.url}?`];
      delete merdgedOptions['url'];
    }

    return new Wmts(merdgedOptions);
  }
}
