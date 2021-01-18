import Feature from 'ol/Feature';
import { get as getProjection, transformExtent } from 'ol/proj';
import {
  IFeatureType,
  IAttribute,
  IGisRequest,
  IQueryFeatureTypeResponse,
  IQuerySource,
  IIdentifyRequest,
} from '../IExtended';
import { toGeoJSONGeometry, disjoint, getQueryId } from '../../utils';
import { getForViewAndSize } from 'ol/extent';
import Geometry from 'ol/geom/Geometry';
import { Engine } from 'bhreq';
import WFSFormat from 'ol/format/WFS';
import JSONFormat from 'ol/format/GeoJSON';
import Projection from 'ol/proj/Projection';

export function loadWfsFeaturesOnBBOX(
  url: string,
  type: IFeatureType<string>,
  queryType: 'query' | 'identify',
  requestProjectionCode: string,
  featureProjectionCode: string,
  bbox: number[],
  limit: number,
  version = '1.1.0',
  outputFormat = 'text/xml; subtype=gml/3.1.1',
  swapXY = false,
  id?: number | string
): Promise<Feature[]> {
  const params: { [id: string]: string } = {};
  params.SERVICE = 'WFS';
  params.VERSION = version;
  params.REQUEST = 'GetFeature';
  params.TYPENAME = getQueryId<string>(type);
  params.MAXFEATURES = `${limit}`;
  params.OUTPUTFORMAT = outputFormat;
  if (bbox != null && bbox.length === 4) {
    if (!swapXY) {
      params.BBOX = `${bbox.join(',')},${requestProjectionCode}`;
    } else {
      params.BBOX += `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]},${requestProjectionCode}`;
    }
  }
  if (id != null) {
    params.FEATUREID = `${id}`; // GeoServer, BG, QGis Server
    // ?? // MapServer
    // ?? // ArcGIS WFS
  }

  return Engine.getInstance()
    .send({
      url,
      params,
      responseType: 'text',
    })
    .then(
      (res) => {
        if (res.status !== 200) {
          throw new Error('WFS request error ' + res.status);
        }
        let txt = res.text;
        let dataProjection = getProjection(requestProjectionCode);
        const features = [] as Feature[];
        let allFeatures = [] as Feature[];
        if (outputFormat === 'application/json') {
          // JSON
          // Read features
          allFeatures = new JSONFormat().readFeatures(txt);
        } else {
          // GML
          // Search projection on results
          let dataProjectionCode = requestProjectionCode;
          const res1 = txt.match(/\ssrsName=\"([^\"]+)\"/i);
          if (res1 && res1.length >= 2) {
            const res2 = res1[1].match(/(\d+)(?!.*\d)/g);
            if (res2 && res2.length > 0) {
              dataProjectionCode = 'EPSG:' + res2[res2.length - 1];
              txt = txt.replace(/\ssrsName=\"([^\"]+)\"/gi, ` srsName="${dataProjectionCode}"`);
            }
          }
          try {
            dataProjection = getProjection(dataProjectionCode);
          } catch (err) {
            console.error(err);
          }
          // Hack for GeoServer with space in name
          if (/\s/.test(getQueryId<string>(type))) {
            const withoutSpace = getQueryId<string>(type).replace(/\s/g, '_');
            const withSpace = getQueryId<string>(type).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
            txt = txt.replace(new RegExp('<' + withSpace, 'g'), '<' + withoutSpace);
            txt = txt.replace(new RegExp('</' + withSpace, 'g'), '</' + withoutSpace);
          }
          // Read features
          allFeatures = new WFSFormat({
            /*version*/
          }).readFeatures(txt);
        }
        if (allFeatures != null && allFeatures.length > 0) {
          allFeatures.forEach((feature: Feature) => {
            if (limit == null || features.length < limit) {
              // !!!! Need Reverse coordinates ???? IN GML3.1 ???
              /*if (dataProjection.getUnits() === 'degrees') {
                if (feature.getGeometry()) {
                  // In degree: This formats the geographic coordinates in longitude/latitude (x/y) order.
                  // Reverse coordinates !
                  (feature.getGeometry() as SimpleGeometry).applyTransform(
                    (input: number[], ouput: number[], dimension: number) => {
                      for (let i = 0; i < input.length; i += dimension) {
                        const y = input[i];
                        const x = input[i + 1];
                        ouput[i] = x;
                        ouput[i + 1] = y;
                      }
                      return ouput;
                    }
                  );
                }
              }*/
              if (feature.getGeometry()) {
                feature.getGeometry().transform(dataProjection, featureProjectionCode);
              }
              features.push(feature);
            }
          });
        }
        return features;
      },
      (err) => {
        console.error('Get WMS feature info in error');
        return err;
      }
    );
}

export function executeWfsQuery(
  source: IQuerySource,
  url: string,
  type: IFeatureType<string>,
  request: IGisRequest,
  version = '1.1.0',
  outputFormat = 'text/xml; subtype=gml/3.1.1',
  requestProjectionCode = 'EPSG:3857',
  swapXY = false
): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, queryType, limit } = request;
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  let extent = transformExtent(geometry.getExtent(), geometryProjection, requestProjectionCode);
  if (queryType === 'identify') {
    const { identifyTolerance } = request as IIdentifyRequest;
    let tolerance;
    if (Math.round(identifyTolerance) > 0) {
      tolerance = Math.round(identifyTolerance);
    } else {
      tolerance = 4;
    }
    extent = getForViewAndSize(
      [0.5 * extent[0] + 0.5 * extent[2], 0.5 * extent[1] + 0.5 * extent[3]],
      olView.getResolution(),
      0,
      [tolerance, tolerance]
    );
  }
  return loadWfsFeaturesOnBBOX(
    url,
    type,
    'query',
    requestProjectionCode,
    mapProjection.getCode(),
    extent,
    limit,
    version,
    outputFormat,
    swapXY
  ).then((allFeatures) => {
    const features = [] as Feature[];
    if (allFeatures && allFeatures.length > 0) {
      allFeatures.forEach((feature: Feature) => {
        // Check intersection
        if (feature.getGeometry() != null) {
          const geom = feature.getGeometry().clone();
          geom.transform(mapProjection, geometryProjection);
          if (
            (queryType === 'identify' && (geometry.getType() === 'Point' || geometry.getType() === 'MultiPoint')) ||
            !disjoint(toGeoJSONGeometry(geom), toGeoJSONGeometry(geometry))
          ) {
            features.push(feature);
          }
        } else {
          features.push(feature);
        }
      });
    }
    return {
      type,
      features,
      source,
    };
  });
}

export function retrieveWfsFeature(
  url: string,
  type: IFeatureType<string>,
  id: number | string,
  featureProjection: Projection,
  version = '1.1.0',
  outputFormat = 'text/xml; subtype=gml/3.1.1',
  requestProjectionCode = 'EPSG:3857',
  swapXY = false
): Promise<Feature> {
  const mapExtent: number[] = [];
  return loadWfsFeaturesOnBBOX(
    url,
    type,
    'query',
    requestProjectionCode,
    featureProjection.getCode(),
    mapExtent,
    1,
    version,
    outputFormat,
    swapXY,
    id
  ).then((allFeatures) => {
    let feature = null;
    if (allFeatures != null && allFeatures.length > 0) {
      feature = allFeatures[0];
    }
    return feature;
  });
}

export function loadWfsFeatureDescription(
  url: string,
  type: IFeatureType<string>,
  version = '1.1.0',
  outputFormat = 'text/xml; subtype=gml/3.1.1',
  requestProjectionCode = 'EPSG:3857'
): Promise<void> {
  const mapExtent: number[] = [];
  return loadWfsFeaturesOnBBOX(
    url,
    type,
    'query',
    requestProjectionCode,
    requestProjectionCode,
    mapExtent,
    1,
    version,
    outputFormat
  ).then((allFeatures) => {
    let feature = null;
    if (allFeatures != null && allFeatures.length > 0) {
      type.attributes = [];
      feature = allFeatures[0];
      const properties = feature.getProperties();
      Object.keys(properties).forEach((key) => {
        const attribute: IAttribute = {
          key,
          type: 'Unknown',
        };
        const value = properties[key];
        if (value != null) {
          if (typeof value === 'string') {
            attribute.type = 'String';
          } else if (typeof value === 'object' && value instanceof Geometry) {
            attribute.type = 'Geometry';
          }
        }
        type.attributes.push(attribute);
      });
    }
  });
}
