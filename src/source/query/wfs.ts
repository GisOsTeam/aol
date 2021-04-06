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
import { Extent, getForViewAndSize } from 'ol/extent';
import Geometry from 'ol/geom/Geometry';
import { Engine } from 'bhreq';
import WFSFormat from 'ol/format/WFS';
import JSONFormat from 'ol/format/GeoJSON';
import Projection from 'ol/proj/Projection';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import Polygon from 'ol/geom/Polygon';

export const DEFAULT_TOLERANCE = 4;

export function loadWfsFeaturesOnBBOX(options: {
  url: string;
  type: IFeatureType<string>;
  queryType: 'query' | 'identify';
  requestProjectionCode: string;
  featureProjectionCode: string;
  bbox: number[];
  limit: number;
  version: '1.0.0' | '1.1.0' | '2.0.0';
  outputFormat: string;
  swapXYBBOXRequest?: boolean;
  swapLonLatGeometryResult?: boolean;
  id?: number | string;
}): Promise<Feature[]> {
  const params: { [id: string]: string } = {};
  params.SERVICE = 'WFS';
  params.VERSION = options.version;
  params.REQUEST = 'GetFeature';
  params.TYPENAME = getQueryId<string>(options.type);
  params.MAXFEATURES = `${options.limit}`;
  params.OUTPUTFORMAT = options.outputFormat;
  if (options.bbox != null && options.bbox.length === 4) {
    if (options.swapXYBBOXRequest !== true) {
      params.BBOX = `${options.bbox.join(',')},${options.requestProjectionCode}`;
    } else {
      params.BBOX += `${options.bbox[1]},${options.bbox[0]},${options.bbox[3]},${options.bbox[2]},${options.requestProjectionCode}`;
    }
  }
  if (options.id != null) {
    params.FEATUREID = `${options.id}`; // GeoServer, BG, QGis Server
    // ?? // MapServer
    // ?? // ArcGIS WFS
  }

  return Engine.getInstance()
    .send({
      url: options.url,
      params,
      responseType: 'text',
    })
    .then(
      (res) => {
        if (res.status !== 200) {
          throw new Error('WFS request error ' + res.status);
        }
        let txt = res.text;
        let dataProjection = getProjection(options.requestProjectionCode);
        const features = [] as Feature[];
        let allFeatures = [] as Feature[];
        if (options.outputFormat === 'application/json') {
          // JSON
          // Read features
          allFeatures = new JSONFormat().readFeatures(txt);
        } else {
          // GML
          // Search projection on results
          let dataProjectionCode = options.requestProjectionCode;
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
          if (/\s/.test(getQueryId<string>(options.type))) {
            const withoutSpace = getQueryId<string>(options.type).replace(/\s/g, '_');
            const withSpace = getQueryId<string>(options.type).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
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
            if (options.limit == null || features.length < options.limit) {
              if (options.swapLonLatGeometryResult === true && dataProjection.getUnits() === 'degrees') {
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
              }
              if (feature.getGeometry()) {
                feature.getGeometry().transform(dataProjection, options.featureProjectionCode);
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

export function executeWfsQuery(options: {
  source: IQuerySource;
  url: string;
  type: IFeatureType<string>;
  request: IGisRequest;
  requestProjectionCode: string;
  version: '1.0.0' | '1.1.0' | '2.0.0';
  outputFormat: string;
  swapXYBBOXRequest: boolean;
  swapLonLatGeometryResult: boolean;
}): Promise<IQueryFeatureTypeResponse> {
  const { olMap, geometry, geometryProjection, queryType, limit } = options.request;
  const olView = olMap.getView();
  const mapProjection = olView.getProjection();
  const originalExtent = geometry.getExtent();
  let extentUsed = [...originalExtent];
  if (queryType === 'identify') {
    const { identifyTolerance } = options.request as IIdentifyRequest;
    // Assignation de la résolution
    const resolution = olView.getResolution() == null ? 1 : olView.getResolution();
    // Assignation de la tolérance à appliquer
    const geoTolerance = (Math.round(identifyTolerance) > 0 ? identifyTolerance : DEFAULT_TOLERANCE) * resolution;
    // Calcul de la largeur géo référencée comprenant la largeur de l'étendue originale et 2 * la tolérance (gauche et droite)
    const geoWidth = Math.abs(originalExtent[2] - originalExtent[0]) + 2 * geoTolerance;
    // Calcul de la hauteur géo référencée comprenant la hauteur de l'étendue originale et 2 * la tolérance (haut et bas)
    const geoHeight = Math.abs(originalExtent[3] - originalExtent[1]) + 2 * geoTolerance;
    // Calcul du centre de l'étendue originale
    const originalExtentCenter = [
      0.5 * originalExtent[0] + 0.5 * originalExtent[2],
      0.5 * originalExtent[1] + 0.5 * originalExtent[3],
    ];
    // Calcule de l'étendue intégrant la tolérance
    const extentBuffered = getForViewAndSize(
      originalExtentCenter,
      1, // 1 car déjà en géo !
      0, // 0 car déjà en géo !
      [geoWidth, geoHeight]
    );
    // Utilisation de l'étendue intégrant la tolérance comme étendue par défaut
    extentUsed = [...extentBuffered];
  }

  // Polygone créé à partir de l'étendue utilisée avant une potentielle reprojection
  const extentUsedAsPolygon = new Polygon([
    [
      [extentUsed[0], extentUsed[1]],
      [extentUsed[0], extentUsed[3]],
      [extentUsed[2], extentUsed[3]],
      [extentUsed[2], extentUsed[1]],
      [extentUsed[0], extentUsed[1]],
    ],
  ]);
  // Utilisation de l'étendue re-projetée comme étendue par défaut
  extentUsed = transformExtent(geometry.getExtent(), geometryProjection, options.requestProjectionCode);
  return loadWfsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: mapProjection.getCode(),
    bbox: extentUsed,
    limit,
    version: options.version,
    outputFormat: options.outputFormat,
    swapXYBBOXRequest: options.swapXYBBOXRequest,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
  }).then((allFeatures) => {
    const features = [] as Feature[];
    if (allFeatures && allFeatures.length > 0) {
      allFeatures.forEach((feature: Feature) => {
        // Check intersection
        if (feature.getGeometry() != null) {
          // Duplication de la géométrie de la feature courante et transformation vers la projection de la géométrie
          // source
          const geom = feature.getGeometry().clone().transform(mapProjection, geometryProjection);
          // Si en mode identify et la géométrie source et de type point (ou multi point)
          // Ou si les géométries s'intersectent
          // Alors on ajoute la feature aux features à retourner
          if (
            (queryType === 'identify' && (geometry.getType() === 'Point' || geometry.getType() === 'MultiPoint')) ||
            !disjoint(toGeoJSONGeometry(geom), toGeoJSONGeometry(extentUsedAsPolygon))
          ) {
            features.push(feature);
          }
        } else {
          features.push(feature);
        }
      });
    }
    return {
      type: options.type,
      features,
      source: options.source,
    };
  });
}

export function retrieveWfsFeature(options: {
  url: string;
  type: IFeatureType<string>;
  id: number | string;
  requestProjectionCode: string;
  featureProjection: Projection;
  version: '1.0.0' | '1.1.0' | '2.0.0';
  outputFormat: string;
  swapXYBBOXRequest: boolean;
  swapLonLatGeometryResult: boolean;
}): Promise<Feature> {
  return loadWfsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.featureProjection.getCode(),
    bbox: [],
    limit: 1,
    version: options.version,
    outputFormat: options.outputFormat,
    swapLonLatGeometryResult: options.swapLonLatGeometryResult,
    id: options.id,
  }).then((allFeatures) => {
    let feature = null;
    if (allFeatures != null && allFeatures.length > 0) {
      feature = allFeatures[0];
    }
    return feature;
  });
}

export function loadWfsFeatureDescription(options: {
  url: string;
  type: IFeatureType<string>;
  version: '1.0.0' | '1.1.0' | '2.0.0';
  outputFormat: string;
  requestProjectionCode: string;
}): Promise<void> {
  return loadWfsFeaturesOnBBOX({
    url: options.url,
    type: options.type,
    queryType: 'query',
    requestProjectionCode: options.requestProjectionCode,
    featureProjectionCode: options.requestProjectionCode,
    bbox: [],
    limit: 1,
    version: options.version,
    outputFormat: options.outputFormat,
  }).then((allFeatures) => {
    let feature = null;
    if (allFeatures != null && allFeatures.length > 0) {
      options.type.attributes = [];
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
        options.type.attributes.push(attribute);
      });
    }
  });
}
