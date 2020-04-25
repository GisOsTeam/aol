import { Pixel } from 'ol/pixel';
import { Map } from 'ol';
import OlBaseLayer from 'ol/layer/Base';
import Layer from 'ol/layer/Layer';
import { IQueryResponse, constructIdentifyQueryRequestFromPixel, IExtended } from '../IExtended';
import { walk } from '../../utils';

export type IdentifyFilterType = (extended: IExtended) => boolean;
export function identify(
  pixel: Pixel,
  map: Map,
  limit: number = 10,
  filter?: IdentifyFilterType
): Promise<IQueryResponse[]> {
  if (map && pixel) {
    const promises: Promise<IQueryResponse>[] = [];
    const queryRequest = constructIdentifyQueryRequestFromPixel(pixel, 2, map);
    queryRequest.limit = limit;

    walk(map, (layer: OlBaseLayer) => {
      if (layer.getVisible() && 'getSource' in layer) {
        const source = (layer as Layer).getSource();
        if (source && 'query' in source) {
          const extended = source as IExtended;
          if (!filter || filter(extended)) {
            promises.push(extended.query(queryRequest));
          }
        }
      }
      return true;
    });

    return Promise.all(promises);
  }
}
