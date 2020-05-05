import Map from 'ol/Map';
import GroupLayer from 'ol/layer/Group';
import BaseLayer from 'ol/layer/Base';
import View from 'ol/View';
import Geometry from 'ol/geom/Geometry';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import GeoJSON, { GeoJSONGeometry } from 'ol/format/GeoJSON';
import { LayerStyles } from './LayerStyles';
import { fromCircle } from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';
import booleanDisjoint from '@turf/boolean-disjoint';
import { applyStyle } from 'ol-mapbox-style';
import { SourceType, SourceTypeEnum } from './source/types/sourceType';
import { IFeatureType, IExtended } from './source/IExtended';
import { ExternalVector } from './source/ExternalVector';
import { ImageArcGISRest } from './source/ImageArcGISRest';
import { ImageStatic } from './source/ImageStatic';
import { ImageWms } from './source/ImageWms';
import { LocalVector } from './source/LocalVector';
import { QueryArcGISRest } from './source/QueryArcGISRest';
import { TileArcGISRest } from './source/TileArcGISRest';
import { TileWms } from './source/TileWms';
import { Wfs } from './source/Wfs';
import { Xyz } from './source/Xyz';

const geoJSONFormat = new GeoJSON();

/**
 * Walk recursively.
 * @param  top {Map | GroupLayer} map or group
 * @param  fn {Function} fn callback function
 */
export function walk(top: Map | GroupLayer, fn: (layer: BaseLayer, idx: number, parent: GroupLayer) => boolean) {
  const group = top instanceof Map ? top.getLayerGroup() : top;
  if (group == null) {
    return;
  }
  group.getLayers().forEach((layer: BaseLayer, idx: number) => {
    if (layer) {
      const cont = fn(layer, idx, group);
      if (cont !== false && layer instanceof GroupLayer) {
        walk(layer, fn);
      }
    }
  });
}

/**
 * Clone view.
 * @param {View} view
 */
export function cloneView(view: View) {
  const center = view.getCenter();
  const newCenter = [center[0], center[1]] as [number, number];
  return new View({
    center: newCenter,
    zoom: view.getZoom(),
    resolution: view.getResolution(),
    rotation: view.getRotation(),
    projection: view.getProjection(),
    maxResolution: view.getMaxResolution(),
    minResolution: view.getMinResolution(),
    maxZoom: view.getMaxZoom(),
    minZoom: view.getMinZoom(),
    resolutions: view.getResolutions(),
  });
}

/**
 * Reverse coordinates.
 * @param {SimpleGeometry} geometry
 */
export function revertCoordinate(geometry: SimpleGeometry): void {
  return geometry.applyTransform((input: number[], ouput: number[], dimension: number) => {
    for (let i = 0; i < input.length; i += dimension) {
      const y = input[i];
      const x = input[i + 1];
      ouput[i] = x;
      ouput[i + 1] = y;
    }
    return ouput;
  });
}

/**
 * Transform OpenLayers geometry to GeoJSON geometry
 * @param {Geometry} geometry
 */
export function toGeoJSONGeometry(geometry: Geometry): GeoJSONGeometry {
  if (geometry.getType() === 'Circle') {
    geometry = fromCircle(geometry as Circle);
  }
  return (geoJSONFormat.writeGeometryObject(geometry) as any) as GeoJSONGeometry;
}

/**
 * Check if two geojson geometries are disjoint
 * @param {GeoJSONGeometry} g1
 * @param {GeoJSONGeometry} g2
 */
export function disjoint(g1: GeoJSONGeometry, g2: GeoJSONGeometry) {
  return booleanDisjoint(g1 as any, g2 as any);
}

/**
 * Get replacer for stringify.
 */
function getCircularReplacer() {
  const seen: any[] = [];
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      const idx = seen.indexOf(value);
      if (idx !== -1) {
        return `[Circular ~.${idx}]`;
      }
      seen.push(value);
    }
    return value;
  };
}

/**
 * Perform JSON equal.
 * @param {any} obj1 object 1
 * @param {any} obj2 object 2
 * @param {string[]} ignore list of ignored attribute
 */
export function jsonEqual(obj1: any, obj2: any, ignore?: string[]): boolean {
  if (obj1 === obj2) {
    return true;
  }
  if (obj1 == null || obj2 == null) {
    return false;
  }
  let str1 = '';
  let obj = { ...obj1 };
  if (ignore != null) {
    for (const key of ignore) {
      obj[key] = null;
    }
  }
  try {
    str1 = JSON.stringify(obj, getCircularReplacer());
  } catch (error) {
    console.error(error, obj);
  }
  let str2 = '';
  obj = { ...obj2 };
  if (ignore != null) {
    for (const key of ignore) {
      obj[key] = null;
    }
  }
  try {
    str2 = JSON.stringify(obj, getCircularReplacer());
  } catch (error) {
    console.error(error, obj);
  }
  return str1 === str2;
}

/**
 * Generate unique id.
 */
export function uid(): string {
  globalKey++;
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // use high-precision timer if available
  }
  return (
    'xxxxxxxxxxxxxxxy'.replace(/[xy]/g, (c) => {
      // tslint:disable-next-line:no-bitwise
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      // tslint:disable-next-line:no-bitwise
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }) + globalKey.toString(16)
  );
}

let globalKey = 0;

/**
 * Generate LAYERS param from IFeatureType array.
 * @param {IFeatureType<string>[]} types list of feature type
 */
export function getWmsLayersFromTypes(types: IFeatureType<string>[]): string {
  if (types == null || types.length === 0) {
    return undefined;
  } else {
    return types
      .filter((t) => !t.hide)
      .map((t) => t.id)
      .join(',');
  }
}

/**
 * Generate LAYERS param from IFeatureType array.
 * @param {IFeatureType<number>[]} types list of feature type
 */
export function getAgsLayersFromTypes(types: IFeatureType<number>[]): string {
  if (types == null || types.length === 0) {
    return 'show:-1';
  } else {
    return `show:${types
      .filter((t) => t.id !== -1 && !t.hide)
      .map((t) => t.id)
      .join(',')}`;
  }
}

/**
 * Get default MB layer style
 */
export function getDefaultLayerStyles(): LayerStyles {
  return [
    {
      type: 'circle',
      paint: {
        'circle-color': 'rgba(127, 127, 127, 0.2)',
        'circle-stroke-color': 'rgba(0, 0, 0, 0.9)',
        'circle-radius': 3,
        'circle-stroke-width': 2,
      },
    },
    {
      type: 'line',
      paint: {
        'line-color': 'rgba(0, 0, 255, 0.9)',
        'line-cap': 'butt',
        'line-join': 'miter',
        'line-width': 2,
      },
    },
    {
      type: 'fill',
      paint: {
        'fill-color': 'rgba(127, 127, 127, 0.2)',
      },
    },
  ];
}

/**
 * Create source from options.
 */
export function createSource(sourceTypeName: SourceType, sourceOptions: any): IExtended {
  let source: IExtended;
  switch (sourceTypeName) {
    case SourceTypeEnum.ExternalVector:
      source = new ExternalVector(sourceOptions);
      break;
    case SourceTypeEnum.ImageArcGISRest:
      source = new ImageArcGISRest(sourceOptions);
      break;
    case SourceTypeEnum.ImageStatic:
      source = new ImageStatic(sourceOptions);
      break;
    case SourceTypeEnum.ImageWms:
      source = new ImageWms(sourceOptions);
      break;
    case SourceTypeEnum.LocalVector:
      source = new LocalVector(sourceOptions);
      break;
    case SourceTypeEnum.QueryArcGISRest:
      source = new QueryArcGISRest(sourceOptions);
      break;
    case SourceTypeEnum.TileArcGISRest:
      source = new TileArcGISRest(sourceOptions);
      break;
    case SourceTypeEnum.TileWms:
      source = new TileWms(sourceOptions);
      break;
    case SourceTypeEnum.Wfs:
      source = new Wfs(sourceOptions);
      break;
    case SourceTypeEnum.Xyz:
      source = new Xyz(sourceOptions);
      break;
  }
  return source;
}

/**
 * Apply MB style.
 */
export function applyLayerStyles(layer: BaseLayer, layerStyles: LayerStyles, id: string) {
  if (layerStyles == null && 'setStyle' in layer) {
    (layer as any).setStyle(undefined);
    return;
  }
  const mbstyle = {
    version: 8,
    sources: {} as any,
    layers: [] as any[],
  };
  mbstyle.sources[id] = { type: 'vector' };
  layerStyles.forEach((style) => {
    mbstyle.layers.push({ ...style, source: id });
  });
  applyStyle(layer, mbstyle, id);
}
