import Feature from 'ol/Feature';
import EsriJSON from 'ol/format/EsriJSON';
import {
  IAttribute,
  IExtended,
  IFeatureType,
  IQueryFeatureTypeResponse,
  IGisRequest,
  IQueryRequest,
  IIdentifyRequest,
} from '../IExtended';
import Projection from 'ol/proj/Projection';
import { Engine } from 'bhreq';
import { AgsIdentifyRequest } from './model/AgsIdentifyRequest';
import { AgsQueryRequest } from './model/AgsQueryRequest';
import { getQueryId } from '../../utils';
import { ImageArcGISRest } from '../ImageArcGISRest';

const format = new EsriJSON();

export function executeAgsIdentify(
  source: IExtended,
  types: IFeatureType<number>[],
  request: IIdentifyRequest
): Promise<IQueryFeatureTypeResponse[]> {
  const { olMap, limit } = request;

  const mapProjection = olMap.getView().getProjection();

  let url = '';
  if ('getUrl' in source) {
    url = (source as any).getUrl();
  } else if ('getUrls' in source) {
    url = (source as any).getUrls()[0];
  }
  url += '/identify';

  const identifyTypes = request.types || types;
  const body = new AgsIdentifyRequest(source, identifyTypes, request);
  const httpEngine = Engine.getInstance();
  return httpEngine
    .send({
      url,
      body,
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      responseType: 'json',
    })
    .then(
      (res) => {
        return processAgsResponse(res, source, identifyTypes, mapProjection, body.getSrId(), limit);
      },
      (err) => {
        console.error(`Execute AGS identify in error: ${err}`);
        return err;
      }
    );
}

export function executeAgsQuery(
  source: IExtended,
  type: IFeatureType<number>,
  request: IGisRequest
): Promise<IQueryFeatureTypeResponse> {
  const { olMap, queryType, limit } = request;

  const mapProjection = olMap.getView().getProjection();

  let url = '';
  if ('getUrl' in source) {
    url = (source as any).getUrl();
  } else if ('getUrls' in source) {
    url = (source as any).getUrls()[0];
  }
  url += queryType === 'identify' ? '/identify' : `/${getQueryId<number>(type)}/query`;

  let body: AgsIdentifyRequest | AgsQueryRequest;
  switch (queryType) {
    case 'identify':
      body = new AgsIdentifyRequest(source, [type], request as IIdentifyRequest);
      break;
    case 'query':
      body = new AgsQueryRequest(source, type, request as IQueryRequest);
      break;
  }

  return Engine.getInstance()
    .send({
      url,
      body,
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      responseType: 'json',
    })
    .then(
      (res) => {
        const [formattedResp] = processAgsResponse(res, source, [type], mapProjection, body.getSrId(), limit);
        return formattedResp;
      },
      (err) => {
        console.error(`Execute AGS query/identify in error: ${err}`);
        return err;
      }
    );
}

function processAgsResponse(
  res: any,
  source: IExtended,
  types: IFeatureType<number>[],
  mapProjection: Projection,
  srId: string,
  limit?: number
): IQueryFeatureTypeResponse[] {
  const featuresByType: Map<IFeatureType<number>, Feature[]> = new Map();
  // Read features
  let jsonQueryRes = res.body;
  if (typeof jsonQueryRes === 'string') {
    try {
      jsonQueryRes = JSON.parse(jsonQueryRes);
    } catch (e) {
      console.error(`Error occurred during reading identify response body `);
      return e;
    }
  }
  if (jsonQueryRes != null) {
    const jsonResults = jsonQueryRes.results || jsonQueryRes.features;
    if (jsonResults != null && jsonResults.length > 0) {
      jsonResults.forEach((jsonResult: any) => {
        const type = types.length === 1 ? types[0] : types.find((type) => type.id === jsonResult.layerId);
        if (type) {
          const feature = format.readFeature(jsonResult, {
            dataProjection: `EPSG:${srId}`,
            featureProjection: mapProjection,
          }) as Feature;

          if (feature.getId() == null && type && type.identifierAttribute != null) {
            // Search id
            const properties = feature.getProperties();
            feature.setId(properties[type.identifierAttribute.key]);
          }
          const oldArray = featuresByType.get(type) || [];
          if (limit == undefined || oldArray.length < limit) {
            oldArray.push(feature);
          }
          featuresByType.set(type, oldArray);
        }
      });
    }
  }

  const responses: IQueryFeatureTypeResponse[] = [];
  types.forEach((type) => {
    const features = featuresByType.get(type) || [];
    responses.push({
      type,
      features,
      source,
    });
  });
  return responses;
}

export function retrieveAgsFeature(
  source: IExtended,
  type: IFeatureType<number>,
  id: number | string,
  featureProjection: Projection
): Promise<Feature> {
  const srId = '3857';
  let url = '';
  if ('getUrl' in source) {
    url = (source as any).getUrl();
  } else if ('getUrls' in source) {
    url = (source as any).getUrls()[0];
  }
  const body: { [id: string]: string } = {};
  url += `/${getQueryId<number>(type)}/query`;
  body.inSR = srId;
  body.outSR = srId;
  body.objectIds = `${id}`;
  body.outFields = '*';
  body.returnFieldName = 'true';
  body.returnGeometry = 'true';
  body.f = 'json';
  return Engine.getInstance()
    .send({
      url,
      body,
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      responseType: 'json',
    })
    .then(
      (res) => {
        // Read features
        let feature = null;
        const jsonQueryRes = res.body;
        if (jsonQueryRes != null) {
          const jsonFeatures = jsonQueryRes.features || jsonQueryRes.results;
          if (jsonFeatures != null && jsonFeatures.length > 0) {
            jsonFeatures.forEach((jsonFeature: any) => {
              feature = format.readFeature(jsonFeature, {
                dataProjection: 'EPSG:' + srId,
                featureProjection,
              }) as Feature;
              if (feature.getId() == null && type.identifierAttribute != null) {
                // Search id
                const properties = feature.getProperties();
                feature.setId(properties[type.identifierAttribute.key]);
              }
            });
          }
        }
        return feature;
      },
      (err) => {
        console.error(`Execute AGS query in error: ${err}`);
        return err;
      }
    );
}

export function loadAgsFeatureDescription(source: IExtended, type: IFeatureType<number>): Promise<void> {
  let url = '';
  if ('getUrl' in source) {
    url = (source as any).getUrl();
  } else if ('getUrls' in source) {
    url = (source as any).getUrls()[0];
  }
  url += `/${getQueryId<number>(type)}?f=json`;
  return Engine.getInstance()
    .send({
      url,
      responseType: 'json',
    })
    .then(
      (res) => {
        if (res.body.fields != null && res.body.fields.length > 0) {
          type.attributes = [];
          res.body.fields.forEach((field: any) => {
            const attribute: IAttribute = {
              key: field.name,
              name: field.alias,
              type: 'Unknown',
            };
            switch (field.type) {
              case 'esriFieldTypeOID':
                attribute.type = 'Oid';
                type.identifierAttribute = attribute;
                break;
              case 'esriFieldTypeInteger':
              case 'esriFieldTypeSmallInteger':
              case 'esriFieldTypeDouble':
              case 'esriFieldTypeSingle':
                attribute.type = 'Number';
                break;
              case 'esriFieldTypeString':
                attribute.type = 'String';
                break;
              case 'esriFieldTypeDate':
                attribute.type = 'Date';
                break;
              case 'esriFieldTypeGeometry':
                attribute.type = 'Geometry';
                break;
            }
            type.attributes.push(attribute);
          });
        }
      },
      (err) => {
        console.error('Get AGS feature description in error');
        return err;
      }
    );
}
