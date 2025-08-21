import {
  IRequest as IBhreqRequest,
  IResponse as IBhreqResponse,
  Engine as BhreqEngine,
  BeforeSendInterceptor as BhreqBeforeSendInterceptor,
  AfterReceivedInterceptor as BhreqAfterReceivedInterceptor,
} from 'bhreq';

export type BeforeSendInterceptor = BhreqBeforeSendInterceptor;
export type AfterReceivedInterceptor = BhreqAfterReceivedInterceptor;

export type IHttpRequest = IBhreqRequest;
export type IHttpResponse = IBhreqResponse;

export interface IHttpEngine {
  send(request: IHttpRequest): Promise<IHttpResponse>;
}

/**
 * Engine for HTTP requests.
 * Defaults to bhreq engine.
 */
export class HttpEngine {
  private static _instance: IHttpEngine;

  static getInstance() {
    if (!this._instance) {
      // Default to bhreq engine
      this._instance = BhreqEngine.getInstance();
    }

    return this._instance;
  }

  static setInstance(engine: IHttpEngine) {
    this._instance = engine;
  }
}
