import Feature from 'ol/Feature';
import { get as getProjection } from 'ol/proj';
import GML3Format from 'ol/format/GML3';
import GML32Format from 'ol/format/GML32';
import GML2Format from 'ol/format/GML2';
import GMLFormat from 'ol/format/GML';
import JSONFormat from 'ol/format/GeoJSON';
import { IFeatureType } from '../source/IExtended';
import { getQueryId } from '../utils';
import Geometry from 'ol/geom/Geometry';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import { WMSGetFeatureInfo } from 'ol/format';
import { Options as WMSGetFeatureInfoOptions } from 'ol/format/WMSGetFeatureInfo';
import { ReadOptions } from 'ol/format/Feature';
import { Extent } from 'ol/extent';

export function readFeatures(
  txt: string,
  options: {
    type: IFeatureType<string>;
    requestProjectionCode: string;
    featureProjectionCode: string;
    limit: number;
    outputFormat: string;
    swapLonLatGeometryResult?: boolean;
  }
): Feature<Geometry>[] {
  const features = [] as Feature<Geometry>[];
  let allFeatures = [] as Feature<Geometry>[];
  let dataProjection = getProjection(options.requestProjectionCode);
  let dataProjectionCode = options.requestProjectionCode;
  if (/[+-/]json($|[+-;])/i.test(options.outputFormat)) {
    // is JSON
    allFeatures = new JSONFormat().readFeatures(txt);
  } else {
    // Search projection on results
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
    if (txt.indexOf('http://www.opengis.net/gml/3.2') > 0) {
      allFeatures = new GML32Format().readFeatures(txt);
    } else if (txt.indexOf(' gml:id="') > 0) {
      allFeatures = new GML3Format().readFeatures(txt);
    } else if (txt.indexOf(' gml:fid="') > 0 || txt.indexOf(' fid="') > 0) {
      allFeatures = new GML2Format().readFeatures(txt);
    } else {
      allFeatures = new GMLFormat().readFeatures(txt);
    }
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
}

export function readWMSFeatures(
  txt: string,
  options: {
    bbox: Extent;
    type: IFeatureType<string>;
    requestProjectionCode: string;
    featureProjectionCode: string;
    limit: number;
    outputFormat: string;
    swapLonLatGeometryResult?: boolean;
  }
): Feature<Geometry>[] {
  const optionsWMSGetFeatureInfo: WMSGetFeatureInfoOptions = { layers: [] };
  if (options.type) {
    optionsWMSGetFeatureInfo.layers.push(options.type.id);
  }

  const optionsRead: ReadOptions = {};
  if (options.requestProjectionCode) {
    optionsRead.dataProjection = options.requestProjectionCode;
  }
  if (options.featureProjectionCode) {
    optionsRead.featureProjection = options.featureProjectionCode;
  }
  if (options.bbox) {
    optionsRead.extent = options.bbox;
  }

  return new WMSGetFeatureInfo(optionsWMSGetFeatureInfo).readFeatures(txt, optionsRead);
}
