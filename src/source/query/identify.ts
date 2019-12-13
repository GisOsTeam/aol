import { Pixel } from 'ol/pixel';
import { Map } from 'ol';
import OlBaseLayer from 'ol/layer/Base';
import Layer from 'ol/layer/Layer';
import { IQueryResponse, constructQueryRequestFromPixel, IExtended } from '../IExtended';
import { walk } from '../../utils';

export function identify(pixel: Pixel, map: Map): Promise<IQueryResponse[]> {
  if (map && pixel) {
    const promises: Array<Promise<IQueryResponse>> = [];
    const queryRequest = constructQueryRequestFromPixel(pixel, 2, map);
    queryRequest.limit = 10;

    walk(map, (layer: OlBaseLayer) => {
      if (layer.getVisible() && 'getSource' in layer) {
        const source = (layer as Layer).getSource();
        if (source && 'query' in source) {
          promises.push((source as IExtended).query(queryRequest));
        }
      }
      return true;
    });

    return Promise.all(promises);
  }
}
