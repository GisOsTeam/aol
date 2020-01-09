import { Pixel } from 'ol/pixel';
import { Map } from 'ol';
import OlBaseLayer from 'ol/layer/Base';
import Layer from 'ol/layer/Layer';
import { IQueryResponse, constructQueryRequestFromPixel, IExtended } from '../IExtended';
import { walk } from '../../utils';

export type IdentifyFilterType = (extended: IExtended) => boolean;
export interface IIdentifyQueryResponse extends IQueryResponse {
  olLayer: Layer;
}

export function identify(
  pixel: Pixel,
  map: Map,
  limit: number = 10,
  filter?: IdentifyFilterType
): Promise<IIdentifyQueryResponse[]> {
  if (map && pixel) {
    const promises: Array<Promise<IIdentifyQueryResponse>> = [];
    const queryRequest = constructQueryRequestFromPixel(pixel, 2, map);
    queryRequest.limit = limit;

    walk(map, (layer: OlBaseLayer) => {
      if (layer.getVisible() && 'getSource' in layer) {
        const olLayer = layer as Layer;
        const source = olLayer.getSource();
        if (source && 'query' in source) {
          const extended = source as IExtended;
          if (!filter || filter(extended)) {
            promises.push(extended.query(queryRequest).then((queryResponse: IQueryResponse) => {
              const identifyQueryResponse = {...queryResponse, olLayer};
              return identifyQueryResponse;
            }));
          }
        }
      }
      return true;
    });

    return Promise.all(promises);
  }
}
