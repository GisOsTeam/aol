import { IRequest, IResponse, send } from 'bhreq';

export type BeforeSendFunctionType = (params: IRequest) => IRequest;
export type AfterReceivedFunctionType = (params: IResponse) => IResponse;

export class HttpInterceptor {
  private static instance: HttpInterceptor;
  public beforeSend: BeforeSendFunctionType[];
  public afterReceived: AfterReceivedFunctionType[];

  private constructor() {
    this.beforeSend = [];
    this.afterReceived = [];
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new HttpInterceptor();
    }
    return this.instance;
  }

  public send(rawRequest: IRequest): Promise<IResponse> {
    let request: IRequest = rawRequest;
    this.beforeSend.forEach((interceptor) => {
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
