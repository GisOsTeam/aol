import { Wmts } from '../Wmts';
import { WmtsFactory } from '../factory/WmtsFactory';
import { IWmtsCapabilitiesOptions } from '../WmtsCapabilities';
import { HttpEngine, IHttpRequest } from '../../HttpEngine';

export class WmtsProvider {
  public static provideSync(
    source: Document | Element | string,
    wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions,
  ): Wmts {
    return WmtsFactory.create(source, this.sanitizeWmtsCapabilitiesOptions(wmtsCapabilitiesOptions));
  }

  public static provideAsync(wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions): Promise<Wmts> {
    const _sanitizedOptions = this.sanitizeWmtsCapabilitiesOptions(wmtsCapabilitiesOptions);

    const request: IHttpRequest = {
      url: _sanitizedOptions.capabilitiesUrl,
      method: 'GET',
      responseType: 'text',
    };

    return HttpEngine.getInstance()
      .send(request)
      .then((response) => {
        let capabilitiesTxt = response.text;
        // HACK
        capabilitiesTxt = capabilitiesTxt.replace(/urn:ogc:def:crs:EPSG:[0-9.]*:([0-9]+)/gi, 'EPSG:$1');
        capabilitiesTxt = capabilitiesTxt.replace(/urn:ogc:def:crs:OGC:[0-9.]*:(CRS)?([0-9]+)/gi, 'CRS:$2');
        // FIN HACK
        return WmtsFactory.create(capabilitiesTxt, _sanitizedOptions);
      });
  }

  private static sanitizeWmtsCapabilitiesOptions(
    wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions,
  ): IWmtsCapabilitiesOptions {
    const _sanitizedOptions = { ...wmtsCapabilitiesOptions };
    if (!wmtsCapabilitiesOptions.layer) {
      throw new Error(`WmtsCapabilitiesOptions.layer is mandatory to provide wmts.`);
    }
    if (!wmtsCapabilitiesOptions.version) {
      _sanitizedOptions.version = '1.0.0';
    }
    if (!wmtsCapabilitiesOptions.capabilitiesUrl) {
      _sanitizedOptions.capabilitiesUrl = `${wmtsCapabilitiesOptions.url}?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=${_sanitizedOptions.version}`;
    }
    return _sanitizedOptions;
  }
}
