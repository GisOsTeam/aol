import { Wmts } from '../Wmts';
import { WmtsFactory } from '../factory/WmtsFactory';
import { IResponse, send } from 'bhreq';
import { IWmtsCapabilitiesOptions } from '../WmtsCapabilities';

export class WmtsProvider {
  public static provideSync(
    source: Document | Element | string,
    wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions
  ): Wmts {
    this.isWmtsSnapshotOptionsValid(wmtsCapabilitiesOptions);
    return WmtsFactory.create(source, wmtsCapabilitiesOptions);
  }

  public static async provideAsync(wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions): Promise<Wmts> {
    this.isWmtsSnapshotOptionsValid(wmtsCapabilitiesOptions);
    if (!wmtsCapabilitiesOptions.capabilitiesUrl) {
      wmtsCapabilitiesOptions.capabilitiesUrl = `${wmtsCapabilitiesOptions.url}?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0`;
    }
    const request = {
      url: wmtsCapabilitiesOptions.capabilitiesUrl,
      method: 'GET',
    };
    const response: IResponse = await send(request);
    let capabilitiesTxt = response.text;
    // HACK
    capabilitiesTxt = capabilitiesTxt.replace(/urn:ogc:def:crs:EPSG:[0-9.]*:([0-9]+)/gi, 'EPSG:$1');
    capabilitiesTxt = capabilitiesTxt.replace(/urn:ogc:def:crs:OGC:[0-9.]*:(CRS)?([0-9]+)/gi, 'CRS:$2');
    // FIN HACK
    return WmtsFactory.create(capabilitiesTxt, wmtsCapabilitiesOptions);
  }

  private static isWmtsSnapshotOptionsValid(wmtsCapabilitiesOptions: IWmtsCapabilitiesOptions): boolean {
    if (!wmtsCapabilitiesOptions.matrixSet) {
      throw new Error(`WmtsSnapshotOptions.matrixSet is mandatory to provide wmts.`);
    }
    if (!wmtsCapabilitiesOptions.url) {
      throw new Error(`WmtsSnapshotOptions.url is mandatory to provide wmts.`);
    }
    if (!wmtsCapabilitiesOptions.layer) {
      throw new Error(`WmtsSnapshotOptions.layer is mandatory to provide wmts.`);
    }
    return true;
  }
}
