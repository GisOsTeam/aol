import Feature from 'ol/Feature';
import { transformExtent } from 'ol/proj';
import EsriJSON from 'ol/format/EsriJSON';
import { IQueryRequest, IFeatureType, IQueryFeatureTypeResponse, IExtended, IAttribute } from '../IExtended';
import { send, IResponse } from 'bhreq';
import { fromCircle } from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';
import Projection from 'ol/proj/Projection';

const format = new EsriJSON();

export function executeAgsQuery(
  source: IExtended,
  type: IFeatureType<number>,
  request: IQueryRequest
): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometryProjection, queryType, limit } = request;
  const srId = '3857';
  let geometry = request.geometry;
  if (geometry.getType() === 'Circle') {
    geometry = fromCircle(geometry as Circle);
  }
  const geometryStr = format.writeGeometry(geometry, {
    featureProjection: geometryProjection,
    dataProjection: 'EPSG:' + srId,
  });
  let geometryType = '';
  switch (geometry.getType()) {
    case 'Point':
      geometryType = 'esriGeometryPoint';
      break;
    case 'LineString':
      geometryType = 'esriGeometryPolyline';
      break;
    case 'LinearRing':
      geometryType = 'esriGeometryPolyline';
      break;
    case 'Polygon':
      geometryType = 'esriGeometryPolygon';
      break;
    case 'MultiPoint':
      geometryType = 'esriGeometryMultipoint';
      break;
    case 'MultiLineString':
      geometryType = 'esriGeometryPoint';
      break;
    case 'MultiPolygon':
      geometryType = 'esriGeometryPolygon';
      break;
  }
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  const extent = transformExtent(geometry.getExtent(), geometryProjection, 'EPSG:' + srId);
  if (extent[0] > extent[2]) {
    const val = extent[0];
    extent[0] = extent[2];
    extent[2] = val;
  }
  if (extent[1] > extent[3]) {
    const val = extent[1];
    extent[1] = extent[3];
    extent[3] = val;
  }
  let url = '';
  if ('getUrl' in source) {
    url = (source as any).getUrl();
  } else if ('getUrls' in source) {
    url = (source as any).getUrls()[0];
  }
  const body: { [id: string]: string } = {};
  body.geometry = geometryStr;
  body.geometryType = geometryType;
  body.outFields = '*';
  body.returnFieldName = 'true';
  body.returnGeometry = 'false';
  if (queryType === 'identify') {
    url += '/identify';
    body.mapExtent = extent.join(',');
    body.imageDisplay = '101,101';
    body.layers = `all:${type.id}`;
    body.sr = srId;
    body.tolerance = '4';
    body.f = 'json';
  } else {
    url += `/${type.id}/query`;
    body.inSR = srId;
    body.outSR = srId;
    body.where = ''; // TODO
    body.f = 'json';
  }
  return send({
    url,
    body,
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    responseType: 'application/json',
  }).then(
    (res: IResponse) => {
      const features = [] as Feature[];
      // Read features
      const jsonQueryRes = res.body;
      if (jsonQueryRes != null) {
        const jsonFeatures = jsonQueryRes.features || jsonQueryRes.results;
        if (jsonFeatures != null && jsonFeatures.length > 0) {
          jsonFeatures.forEach((jsonFeature: any) => {
            if (limit == null || features.length < limit) {
              const feature = format.readFeature(jsonFeature, {
                dataProjection: 'EPSG:' + srId,
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
  return send({
    url,
    body,
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    responseType: 'application/json',
  }).then(
    (res: IResponse) => {
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
  return send({
    url,
    responseType: 'application/json',
  }).then(
    (res: IResponse) => {
      if (res.body.fields != null && res.body.fields.length > 0) {
        type.attributes = [];
        res.body.fields.forEach((field: any) => {
          const attribute: IAttribute = {
            key: field.name,
            name: field.alias,
            type: 'Oid',
          };
          if (field.type === 'esriFieldTypeOID') {
            type.identifierAttribute = attribute;
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
