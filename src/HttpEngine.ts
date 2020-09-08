import { IRequest, IResponse, send } from 'bhreq';

export type BeforeSendInterceptor = (params: IRequest) => IRequest;
export type AfterReceivedInterceptor = (params: IResponse) => IResponse;

export class HttpEngine {
  private static instance: HttpEngine;
  public beforeSendInterceptors: BeforeSendInterceptor[];
  public afterReceivedInterceptors: AfterReceivedInterceptor[];

  private constructor() {
    this.beforeSendInterceptors = [];
    this.afterReceivedInterceptors = [];
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

  private treatResponse = (rawResponse: IResponse): IResponse => {
    let response = rawResponse;
    this.afterReceivedInterceptors.forEach((interceptor) => {
      response = interceptor(response);
    });
    return response;
  };
}
