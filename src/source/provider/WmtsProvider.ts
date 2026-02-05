import { Wmts } from '../Wmts';
import { WmtsFactory } from '../factory/WmtsFactory';
import { IWmtsCapabilitiesOptions } from '../WmtsCapabilities';
import { HttpEngine, IHttpRequest } from '../../HttpEngine';

export class WmtsProvider {
  public static provideSync(
    source: Document | Element | string,
    wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions,
  ): Wmts {
    return WmtsFactory.create(source, this.sanetizeWmtsCapabilitiesOptions(wmtsCapabilitiesOptions));
  }

  public static provideAsync(wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions): Promise<Wmts> {
    const _sanetizedOptions = this.sanetizeWmtsCapabilitiesOptions(wmtsCapabilitiesOptions);

    const request: IHttpRequest = {
      url: _sanetizedOptions.capabilitiesUrl,
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
        return WmtsFactory.create(capabilitiesTxt, _sanetizedOptions);
      });
  }

  private static sanetizeWmtsCapabilitiesOptions(
    wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions,
  ): IWmtsCapabilitiesOptions {
    const _sanetizedOptions = { ...wmtsCapabilitiesOptions };
    if (!wmtsCapabilitiesOptions.layer) {
      throw new Error(`WmtsCapabilitiesOptions.layer is mandatory to provide wmts.`);
    }
    if (!wmtsCapabilitiesOptions.version) {
      _sanetizedOptions.version = '1.0.0';
    }
    if (!wmtsCapabilitiesOptions.capabilitiesUrl) {
      _sanetizedOptions.capabilitiesUrl = `${wmtsCapabilitiesOptions.url}?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=${_sanetizedOptions.version}`;
    }
    return _sanetizedOptions;
  }
}
