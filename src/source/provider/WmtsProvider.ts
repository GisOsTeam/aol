import { Wmts } from '../Wmts';
import { WmtsFactory } from '../factory/WmtsFactory';
import { IWmtsCapabilitiesOptions } from '../WmtsCapabilities';
import { HttpEngine } from '../../HttpEngine';

export class WmtsProvider {
  public static provideSync(
    source: Document | Element | string,
    wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions,
  ): Wmts {
    this.isWmtsCapabilitiesOptionsValid(wmtsCapabilitiesOptions);
    return WmtsFactory.create(source, wmtsCapabilitiesOptions);
  }

  public static provideAsync(wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions): Promise<Wmts> {
    this.isWmtsCapabilitiesOptionsValid(wmtsCapabilitiesOptions);
    if (!wmtsCapabilitiesOptions.capabilitiesUrl) {
      wmtsCapabilitiesOptions.capabilitiesUrl = `${wmtsCapabilitiesOptions.url}?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0`;
    }
    const request = {
      url: wmtsCapabilitiesOptions.capabilitiesUrl,
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
        return WmtsFactory.create(capabilitiesTxt, wmtsCapabilitiesOptions);
      });
  }

  private static isWmtsCapabilitiesOptionsValid(wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions): boolean {
    if (!wmtsCapabilitiesOptions.layer) {
      throw new Error(`WmtsCapabilitiesOptions.layer is mandatory to provide wmts.`);
    }
    return true;
  }
}
