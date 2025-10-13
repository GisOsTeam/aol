import booleanDisjoint from '@turf/boolean-disjoint';
import * as turf from '@turf/turf';
import { Coordinate } from 'ol/coordinate';
import { getCenter, getHeight, getWidth } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON, { GeoJSONFeature, GeoJSONGeometry } from 'ol/format/GeoJSON';
import Circle from 'ol/geom/Circle';
import Geometry from 'ol/geom/Geometry';
import { fromCircle } from 'ol/geom/Polygon';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import BaseLayer from 'ol/layer/Base';
import GroupLayer from 'ol/layer/Group';
import Map from 'ol/Map';
import { ProjectionLike } from 'ol/proj';
import View from 'ol/View';
import { IFeatureType, ILegendRecord, ILegendSource } from './source/IExtended';
import { HttpEngine, IHttpResponse } from './HttpEngine';

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
 * Transform GeoJSON geometry to OpenLayers geometry
 * @param {GeoJSONGeometry} geoJSONGeometry
 * @return  {Geometry} geometry
 */
export function toOpenLayersGeometry(geoJSONGeometry: GeoJSONGeometry): Geometry {
  return geoJSONFormat.readGeometry(geoJSONGeometry);
}

/**
 * Transform OpenLayers geometry to GeoJSON geometry
 * @param {Geometry} geometry
 * @return  {GeoJSONGeometry} geoJSONGeometry
 */
export function toGeoJSONGeometry(geometry: Geometry): GeoJSONGeometry {
  if (geometry.getType() === 'Circle') {
    geometry = fromCircle(geometry as Circle);
  }
  return geoJSONFormat.writeGeometryObject(geometry);
}

/**
 * Transform GeoJSON geometry to OpenLayers geometry
 * @param {GeoJSONFeature} geoJSONFeature
 * @return  {Feature} feature
 */
export function toOpenLayersFeature(geoJSONFeature: GeoJSONFeature): Feature {
  return geoJSONFormat.readFeature(geoJSONFeature) as Feature;
}

/**
 * Transform OpenLayers feature to GeoJSON feature
 * @param {Feature} feature
 * @return {GeoJSONFeature} geoJSONFeature
 */
export function toGeoJSONFeature(feature: Feature): GeoJSONFeature {
  if (feature.getGeometry()?.getType() === 'Circle') {
    feature?.setGeometry(fromCircle(feature.getGeometry() as Circle));
  }
  return geoJSONFormat.writeFeatureObject(feature);
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
 * Apply buffer to geometry
 * @param {GeoJSONFeature} geoJsonFeatureSource
 * @param {number} tolerance
 * @param {ProjectionLike} projectionSource
 * @return {GeoJSONFeature} Buffured feature
 */
export function buffer(
  geoJsonFeatureSource: GeoJSONFeature,
  tolerance: number,
  projectionSource?: ProjectionLike,
): GeoJSONFeature {
  // Si projectionSource non définit alors pas besoin de re-projeter donc on retourne la feature
  if (!projectionSource) {
    return turf.buffer(geoJsonFeatureSource as any, tolerance);
  }
  // Création d'une feature OpenLayers depuis la feature source GeoJSON
  let tmpFeature: Feature = toOpenLayersFeature(geoJsonFeatureSource);
  // Projection de la géométrie de la feature depuis projectionSource vers 'EPSG:4326'
  tmpFeature.setGeometry(tmpFeature.getGeometry().transform(projectionSource, 'EPSG:4326'));
  // Création d'une feature GeoJSON depuis la feature OpenLayers
  const geoJsonFeature = geoJSONFormat.writeFeatureObject(tmpFeature);
  // Application de la tolerance à la géométrie
  const wgs84BufferedFeature: GeoJSONFeature = turf.buffer(geoJsonFeature as any, tolerance);
  // Création d'une feature OpenLayers depuis la feature GeoJSON intégrant la tolérance
  tmpFeature = toOpenLayersFeature(wgs84BufferedFeature);
  // Projection de la géométrie de la feature depuis 'EPSG:4326' vers projectionSource
  tmpFeature.setGeometry(tmpFeature.getGeometry().transform('EPSG:4326', projectionSource));
  // Retour d'une feature GeoJSON
  return geoJSONFormat.writeFeatureObject(tmpFeature);
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

let globalKey = 0;

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
export function getAgsLayersFromTypes(types: IFeatureType<number>[], prefix = 'show'): string {
  if (types == null || types.length === 0) {
    return 'show:-1';
  } else {
    const shownTypes = types.filter((t) => t.id !== -1 && !t.hide).map((t) => t.id);
    return `${prefix}:${shownTypes.length > 0 ? shownTypes.join(',') : '-1'}`;
  }
}

/**
 * Get query id from IFeatureType.
 * @param {IFeatureType} type type
 */
export function getQueryId<IDT>(type: IFeatureType<any>): IDT {
  return type.queryId != null ? type.queryId : type.id;
}

/**
 * Create image element from source.
 */
export function srcToImage(
  dataUrl: string,
  options: { emptyImageOnError: boolean; timeout: number } = { emptyImageOnError: true, timeout: 10000 },
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      if (options.emptyImageOnError === true) {
        resolve(new Image());
      } else {
        reject(new Error('Error on image loading'));
      }
    };
    setTimeout(() => {
      if (options.emptyImageOnError === true) {
        resolve(new Image());
      } else {
        reject(new Error('Error on image loading (timeout)'));
      }
    }, options.timeout);
    img.src = dataUrl;
  });
}

/**
 * Load an image with HttpEngine and return it's URL as a local blob.
 *
 * @param originalImageUrl URL to load image
 * @returns Local blob URL
 */
export async function loadImageUrlWithHttpEngine(originalImageUrl: string): Promise<string> {
  return (
    HttpEngine.getInstance()
      // Request image
      .send({ url: originalImageUrl, responseType: 'blob' })
      // Retrieve image blob from response
      .then((response: IHttpResponse) => response.body)
      // Create URL from image blob
      .then((imageBlob: Blob) => URL.createObjectURL(imageBlob))
  );
}

/**
 * Export to image.
 */
export function exportToImage(
  map: Map,
  imageSize: [number, number],
  extent: [number, number, number, number],
  format: 'JPEG' | 'PNG',
  cancelFunction = () => false,
) {
  const center = getCenter(extent);
  const resolutionX = getWidth(extent) / imageSize[0];
  const resolutionY = getHeight(extent) / imageSize[1];
  const resolution = Math.max(resolutionX, resolutionY);

  return exportToImageFromResolution(map, imageSize, center, resolution, format, cancelFunction);
}

/**
 * Export to image from resolution.
 */
export function exportToImageFromResolution(
  map: Map,
  imageSize: [number, number],
  center: Coordinate,
  resolution: number,
  format: 'JPEG' | 'PNG',
  cancelFunction = () => false,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let canceled = false;
    const initialView = map.getView();
    const initialSize = map.getSize();
    const targetElement = map.getTargetElement() as HTMLDivElement;
    const initialTargetElementWidth = targetElement.style.width;
    const initialTargetElementHeight = targetElement.style.height;
    const reset = () => {
      map.setView(initialView);
      targetElement.style.width = initialTargetElementWidth;
      targetElement.style.height = initialTargetElementHeight;
      map.setSize(initialSize);
      map.updateSize();
    };
    const checkCanceled = () => {
      if (canceled) {
        return true;
      }
      if (cancelFunction()) {
        canceled = true;
        reject(new Error('Canceled'));
        reset();
        return true;
      }
    };
    const intervalId = setInterval(() => {
      checkCanceled();
    }, 5000);
    const buildImage = () => {
      if (checkCanceled()) {
        return;
      }
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = imageSize[0];
      mapCanvas.height = imageSize[1];
      const mapContext = mapCanvas.getContext('2d');
      if (mapContext == null) {
        reject(new Error('Canvas context null'));
        return;
      }

      // On force un background blanc pour avoir un rendu iso OL
      mapContext.fillStyle = 'white';
      mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

      const elems = map.getTargetElement().querySelectorAll('.ol-layer canvas');
      if (elems != null) {
        elems.forEach(function (canvas: any) {
          if (checkCanceled()) {
            return;
          }
          if (canvas.width > 0) {
            const opacity = canvas.parentNode.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : +opacity;
            const transform = canvas.style.transform;
            // Get the transform parameters from the style's transform matrix
            const matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
            // Apply the transform to the export map context
            CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
            mapContext.drawImage(canvas, 0, 0);
          }
        });
      }
      if (checkCanceled()) {
        return;
      }
      try {
        const dataUrl = format === 'JPEG' ? mapCanvas.toDataURL('image/jpeg') : mapCanvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        clearInterval(intervalId);
        reset();
      }
    };
    map.once('rendercomplete', buildImage);
    targetElement.style.width = '';
    targetElement.style.height = '';
    targetElement.style.cssText += `;width: ${imageSize[0]}px !important; height: ${imageSize[1]}px !important;`;
    map.setSize(imageSize);
    map.updateSize();
    const view = new View({
      projection: initialView.getProjection(),
      rotation: initialView.getRotation(),
      center,
      resolution,
    });
    map.setView(view);
  });
}

/**
 * Export legend to image.
 */
export const exportLegendToImage = (
  sources: ILegendSource[],
  imageSize: [number, number],
  format: 'JPEG' | 'PNG',
  cancelFunction = () => false,
): Promise<string> => {
  const legendCanvas = document.createElement('canvas');
  legendCanvas.width = imageSize[0];
  legendCanvas.height = imageSize[1];
  const legendContext = legendCanvas.getContext('2d');
  if (legendContext == null) {
    return Promise.reject(new Error('Canvas context null'));
  }
  legendContext.fillStyle = 'white';
  legendContext.fillRect(0, 0, imageSize[0], imageSize[1]);
  const textSize = 12;
  const maxRatio = 1.5;
  const labelSizeRatio = 0.5;
  const promises: Promise<[number, number, ILegendRecord]>[] = [];
  for (const source of sources) {
    if (cancelFunction()) {
      return Promise.reject(new Error('Canceled'));
    }
    if (typeof source.fetchLegend === 'function') {
      promises.push(
        source.fetchLegend().then(
          (res: ILegendRecord) => {
            let width = 0;
            let height = 0;
            for (const key in res) {
              const legends = res[key];
              for (const legend of legends) {
                if (legend.width > width) {
                  width = legend.width;
                  if (legend.label != null && legend.label.length > 0) {
                    width += labelSizeRatio * textSize * legend.label.length;
                  }
                }
                height += legend.height;
              }
            }
            return [width, height, res];
          },
          () => {
            return [0, 0, {}];
          },
        ),
      );
    }
  }
  let width = 0;
  let height = 0;
  return Promise.all(promises).then((res) => {
    const records: ILegendRecord[] = [];
    for (const [w, h, record] of res) {
      if (w > width) {
        width = w;
      }
      height += h;
      records.push(record);
    }

    const ratio = Math.min(imageSize[0] / width, imageSize[1] / height, maxRatio);
    legendContext.font = `${ratio * textSize}px sans-serif`;
    legendContext.fillStyle = 'black';

    let pos = 0;
    for (const record of records) {
      for (const key in record) {
        const legends = record[key];
        for (const legend of legends) {
          if (cancelFunction()) {
            return Promise.reject(new Error('Canceled'));
          }
          legendContext.drawImage(legend.image, 0, pos, ratio * legend.width, ratio * legend.height);
          if (legend.label != null && legend.label.length > 0) {
            legendContext.fillText(
              legend.label,
              ratio * (legend.width + 2),
              pos + 0.5 * ratio * legend.height + 0.5 * ratio * textSize,
            );
          }
          pos += ratio * legend.height;
        }
      }
    }

    const dataUrl = format === 'JPEG' ? legendCanvas.toDataURL('image/jpeg') : legendCanvas.toDataURL('image/png');
    return Promise.resolve(dataUrl);
  });
};

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 * Ref.: https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function#FNV-1_hash
 *
 * @param {string} s the input value
 * @param {boolean} [asString=false] set to true to return the hash value as
 *     8-digit hex string instead of an integer
 * @param {number} [seed] optionally pass the hash of the previous chunk
 * @returns {number | string}
 */
function hash32(s: string, asString = true, seed = 0x811c9dc5): number | string {
  let hval: number = seed;

  for (let i = 0, l = s.length; i < l; i++) {
    hval ^= s.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  // Convert to 8 digit hex string
  if (asString) {
    return ('0000000' + (hval >>> 0).toString(16)).substr(-8);
  }

  return hval >>> 0;
}

export function hash64(s: string): string {
  const h1 = hash32(s, false) as number; // returns 32 bit (as 8 byte hex string)
  return (hash32(s) as string) + hash32(s, true, h1); // 64 bit (as 16 byte hex string)
}
