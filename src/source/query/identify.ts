import { Pixel } from 'ol/pixel';
import { Map } from 'ol';
import OlBaseLayer from 'ol/layer/Base';
import Layer from 'ol/layer/Layer';
import { IQueryResponse, constructIdentifyQueryRequestFromPixel, IQuerySource, IQueryRequest } from '../IExtended';
import { walk } from '../../utils';
import Geometry from 'ol/geom/Geometry';

export type IdentifyFilterType = (extended: IQuerySource) => boolean;
export type IdentifyEntity = Pixel | Geometry;
export function identify(
  identifyEntity: Pixel | Geometry,
  map: Map,
  limit = 10,
  tolerance = 4,
  filter?: IdentifyFilterType
) {
  if (map && identifyEntity) {
    const promises: Promise<IQueryResponse>[] = [];
    let queryRequest: IQueryRequest;
    if (identifyEntity instanceof Geometry) {
      queryRequest = {
        olMap: map,
        geometry: identifyEntity,
        geometryProjection: map.getView().getProjection(),
        queryType: 'identify',
      };
    } else {
      queryRequest = constructIdentifyQueryRequestFromPixel(identifyEntity, map);
    }

    queryRequest.limit = limit;
    queryRequest.identifyTolerance = tolerance;

    walk(map, (layer: OlBaseLayer) => {
      if (layer.getVisible() && 'getSource' in layer) {
        const source = (layer as Layer).getSource();
        if (source && 'query' in source) {
          const extended = source as IQuerySource;
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
