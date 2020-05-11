import { Wmts, WmtsSnapshotOptions } from '../Wmts';
import { WmtsFactory } from '../factory/WmtsFactory';
import { IResponse, send } from 'bhreq';

export class WmtsProvider {
  public static provideSync(source: Document | Element | string, wmtsSnapshotOptions: WmtsSnapshotOptions): Wmts {
    this.isWmtsSnapshotOptionsValid(wmtsSnapshotOptions);
    return WmtsFactory.create(source, wmtsSnapshotOptions);
  }

  public static async provideAsync(wmtsSnapshotOptions: WmtsSnapshotOptions): Promise<Wmts> {
    this.isWmtsSnapshotOptionsValid(wmtsSnapshotOptions);
    if (!wmtsSnapshotOptions.capabilitiesUrl) {
      throw new Error(`WmtsSnapshotOptions.capabilitiesUrl is mandatory to provide wmts async.`);
    }
    const request = {
      url: wmtsSnapshotOptions.capabilitiesUrl,
      method: 'GET',
    };
    const response: IResponse = await send(request);
    return WmtsFactory.create(response.text, wmtsSnapshotOptions);
  }

  public static async provideOGCAsync(wmtsSnapshotOptions: WmtsSnapshotOptions): Promise<Wmts> {
    this.isWmtsSnapshotOptionsValid(wmtsSnapshotOptions);
    const request = {
      url: `${wmtsSnapshotOptions.url}?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0`,
      method: 'GET',
    };
    const response: IResponse = await send(request);
    return WmtsFactory.create(response.text, wmtsSnapshotOptions);
  }

  private static isWmtsSnapshotOptionsValid(wmtsSnapshotOptions: WmtsSnapshotOptions): boolean {
    if (!wmtsSnapshotOptions.matrixSet) {
      throw new Error(`WmtsSnapshotOptions.matrixSet is mandatory to provide wmts.`);
    }
    if (!wmtsSnapshotOptions.url) {
      throw new Error(`WmtsSnapshotOptions.url is mandatory to provide wmts.`);
    }
    if (!wmtsSnapshotOptions.layer) {
      throw new Error(`WmtsSnapshotOptions.layer is mandatory to provide wmts.`);
    }
    return true;
  }
}
