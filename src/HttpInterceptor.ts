import { IRequest, IResponse, send } from 'bhreq';

export type BeforeSendInterceptorsType = (params: IRequest) => IRequest;
export type AfterReceivedInterceptorsType = (params: IResponse) => IResponse;

export class HttpEngine {
  private static instance: HttpEngine;
  public beforeSendInterceptors: BeforeSendInterceptorsType[];
  public afterReceived: AfterReceivedInterceptorsType[];

  private constructor() {
    this.beforeSendInterceptors = [];
    this.afterReceived = [];
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new HttpEngine();
    }
    return this.instance;
  }

  public send(rawRequest: IRequest): Promise<IResponse> {
    let request: IRequest = rawRequest;
    this.beforeSendInterceptors.forEach((interceptor) => {
      request = interceptor(request);
    });
    return send(request).then(this.treatResponse);
  }
  private treatResponse(rawResponse: IResponse): IResponse {
    let response = rawResponse;
    this.afterReceived.forEach((interceptor) => {
      response = interceptor(response);
    });
    return response;
  }
}
