import Feature from 'ol/Feature';
import EsriJSON from 'ol/format/EsriJSON';
import { IAttribute, IExtended, IFeatureType, IQueryFeatureTypeResponse, IGisRequest } from '../IExtended';
import Projection from 'ol/proj/Projection';
import { HttpEngine } from '../../HttpEngine';
import { AgsIdentifyRequest } from './model/AgsIdentifyRequest';
import { AgsQueryRequest } from './model/AgsQueryRequest';

const format = new EsriJSON();

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
  url += queryType === 'identify' ? '/identify' : `/${type.id}/query`;

  let body: AgsIdentifyRequest | AgsQueryRequest;
  switch (queryType) {
    case 'identify':
      body = new AgsIdentifyRequest(source, type, request);
      break;
    case 'query':
      body = new AgsQueryRequest(source, type, request);
      break;
  }

  const httpEngine = HttpEngine.getInstance();
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
        const features = [] as Feature[];
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
          const jsonFeatures = jsonQueryRes.features || jsonQueryRes.results;
          if (jsonFeatures != null && jsonFeatures.length > 0) {
            jsonFeatures.forEach((jsonFeature: any) => {
              if (limit == null || features.length < limit) {
                const feature = format.readFeature(jsonFeature, {
                  dataProjection: 'EPSG:' + body.getSrId(),
                  featureProjection: mapProjection,
                }) as Feature;
                if (feature.getId() == null && type.identifierAttribute != null) {
                  // Search id
                  const properties = feature.getProperties();
                  feature.setId(properties[type.identifierAttribute.key]);
                }
                features.push(feature);
              }
            });
          }
        }
        return {
          type,
          features,
          source,
        };
      },
      (err) => {
        console.error(`Execute AGS query/identify in error: ${err}`);
        return err;
      }
    );
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
  url += `/${type.id}/query`;
  body.inSR = srId;
  body.outSR = srId;
  body.objectIds = `${id}`;
  body.outFields = '*';
  body.returnFieldName = 'true';
  body.returnGeometry = 'true';
  body.f = 'json';
  return HttpEngine.getInstance()
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
  url += `/${type.id}?f=json`;
  return HttpEngine.getInstance()
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
