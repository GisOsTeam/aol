import { Pixel } from 'ol/pixel';
import { Map } from 'ol';
import OlBaseLayer from 'ol/layer/Base';
import Layer from 'ol/layer/Layer';
import { IIdentifyRequest, IQueryResponse, IQuerySource, LayersPrefix } from '../IExtended';
import { walk } from '../../utils';
import Geometry from 'ol/geom/Geometry';
import Point from 'ol/geom/Point';
import OlMap from 'ol/Map';

export function constructIdentifyQueryRequestFromPixel(pixel: number[], olMap: OlMap): IIdentifyRequest {
  const coord = olMap.getCoordinateFromPixel(pixel);
  return {
    olMap,
    geometry: new Point(coord),
    geometryProjection: olMap.getView().getProjection(),
    queryType: 'identify',
  };
}

export type IdentifyFilterType = (extended: IQuerySource) => boolean;

/**
 *
 * @param identifyEntity
 * @param map
 * @param limit
 * @param tolerance
 * @param filter
 * @param layersPrefix
 * @param returnGeometry
 */
export function identify(
  identifyEntity: Pixel | Geometry,
  map: Map,
  limit = 10,
  tolerance = 4,
  filter?: IdentifyFilterType,
  layersPrefix?: LayersPrefix,
  returnGeometry = true,
) {
  if (map && identifyEntity) {
    const promises: Promise<IQueryResponse>[] = [];
    let queryRequest: IIdentifyRequest;
    if (Array.isArray(identifyEntity)) {
      queryRequest = constructIdentifyQueryRequestFromPixel(identifyEntity, map);
    } else {
      queryRequest = {
        olMap: map,
        geometry: identifyEntity,
        geometryProjection: map.getView().getProjection(),
        queryType: 'identify',
      };
    }

    queryRequest.returnGeometry = returnGeometry;
    queryRequest.limit = limit;
    queryRequest.identifyTolerance = tolerance;

    queryRequest.layersPrefix = layersPrefix;

    walk(map, (layer: OlBaseLayer) => {
      if (isVisible(layer, map.getView()) && 'getSource' in layer) {
        const source = (layer as Layer).getSource();
        if (source && 'query' in source) {
          const extended = source as IQuerySource;
          if (!filter || filter(extended)) {
            promises.push(
              extended.query(queryRequest, true).then(
                (queryResponse) => queryResponse,
                (err) => {
                  console.error('Query error', err);
                  const qr: IQueryResponse = {
                    request: queryRequest,
                    featureTypeResponses: [],
                  };
                  return qr;
                },
              ),
            );
          }
        }
      }
      return true;
    });

    return Promise.all(promises);
  }
}

/**
 * Function to check if a layer is visible, 
 * it checks for the presence of an isVisible method (used in some custom layers) 
 * and falls back to the standard ol/View getVisible method if not present.
 * @param layer - ol/layer/Base layer object
 * @param view - ol/View view object
 * @returns boolean indicating if the layer is visible
 */
function isVisible(layer: OlBaseLayer, view: any): boolean {
  if ('isVisible' in layer && typeof layer['isVisible'] === 'function') {
    return layer.isVisible(view);
  }
  return layer.getVisible();
}