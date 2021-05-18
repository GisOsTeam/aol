import {
  IRequest,
  IResponse,
  Engine,
  BeforeSendInterceptor as BhreqBeforeSendInterceptor,
  AfterReceivedInterceptor as BhreqAfterReceivedInterceptor,
} from 'bhreq';

export type BeforeSendInterceptor = BhreqBeforeSendInterceptor;
export type AfterReceivedInterceptor = BhreqAfterReceivedInterceptor;

/**
 * @deprecated use Engine of bhreq
 */
export class HttpEngine {
  public beforeSendInterceptors: BeforeSendInterceptor[] = Engine.getInstance().beforeSendInterceptors;
  public afterReceivedInterceptors: AfterReceivedInterceptor[] = Engine.getInstance().afterReceivedInterceptors;

  static getInstance() {
    Engine.getInstance();
  }

  public send(rawRequest: IRequest): Promise<IResponse> {
    return Engine.getInstance().send(rawRequest);
  }
}
