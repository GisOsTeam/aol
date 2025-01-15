import OlMap from 'ol/Map';
import OlView from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Text from 'ol/style/Text';
import Icon from 'ol/style/Icon';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import { Feature } from 'ol';

export type LayerStyles = SingleLayerStyle[];

export type SingleLayerStyle =
  | ILineStyle
  | IFillStyle
  | ICircleStyle
  | ITextStyle
  | IIconStyle
  | ISymbolStyle
  | IBackgroundStyle;

export interface StyleRoot {
  constants?: { [key: string]: any };
  layers: LayerStyles;
  olMap?: OlMap;
  cachedZoom?: { [key: number]: number };
  cachedColor?: {
    [key: string]: [number, number, number, number];
  };
}

export type Expression = any[];

export type NumberExpression = number | Expression;

export type StringExpression = string | Expression;

export interface IGeneralStyle {
  id?: string;
  source?: string;
  'source-layer'?: string;
  minzoom?: number;
  maxzoom?: number;
  filter?: Expression;
  filterFunction?: any;
}

export interface ILinePaint {
  'line-width'?: NumberExpression;
  'line-dasharray'?: StringExpression;
  'line-color'?: StringExpression;
  'line-opacity'?: NumberExpression;
  'line-cap'?: StringExpression;
  'line-join'?: StringExpression;
  'line-miter-limit'?: NumberExpression;
}

export interface ILineLayout {
  visibility?: StringExpression;
}

export interface ILineStyle extends IGeneralStyle {
  type: 'line';
  paint?: ILinePaint;
  layout?: ILineLayout;
}

export interface IFillPaint {
  'fill-color'?: StringExpression;
  'fill-opacity'?: NumberExpression;
}

export interface IFillLayout {
  visibility?: StringExpression;
}

export interface IFillStyle extends IGeneralStyle {
  type: 'fill';
  paint?: IFillPaint;
  layout?: IFillLayout;
}

export interface ICirclePaint {
  'circle-radius'?: NumberExpression;
  'circle-stroke-color'?: StringExpression;
  'circle-stroke-opacity'?: NumberExpression;
  'circle-stroke-width'?: NumberExpression;
  'circle-color'?: StringExpression;
  'circle-opacity'?: NumberExpression;
}

export interface ICircleLayout {
  visibility?: StringExpression;
}

export interface ICircleStyle extends IGeneralStyle {
  type: 'circle';
  paint?: ICirclePaint;
  layout?: ICircleLayout;
}

export interface ITextPaint {
  'text-halo-color'?: StringExpression;
  'text-halo-opacity'?: NumberExpression;
  'text-halo-width'?: NumberExpression;
  'text-color'?: StringExpression;
  'text-opacity'?: NumberExpression;
}

export interface ITextLayout {
  visibility?: StringExpression;
  'text-field'?: StringExpression;
  'text-font'?: StringExpression;
  'text-size'?: NumberExpression;
  'text-offset'?: [NumberExpression, NumberExpression];
}

export interface ITextStyle extends IGeneralStyle {
  type: 'text';
  paint?: ITextPaint;
  layout?: ITextLayout;
}

export interface IIconPaint {}

export interface IIconLayout {
  visibility?: StringExpression;
  'icon-image'?: StringExpression;
  'icon-size'?: StringExpression;
}

export interface IIconStyle extends IGeneralStyle {
  type: 'icon';
  paint?: IIconPaint;
  layout?: IIconLayout;
}

export interface ISymbolPaint extends ITextPaint, IIconPaint {}

export interface ISymbolLayout extends ITextLayout, IIconLayout {}

export interface ISymbolStyle extends IGeneralStyle {
  type: 'symbol';
  paint?: ISymbolPaint;
  layout?: ISymbolLayout;
}

export interface IBackgroundPaint {
  'background-color': StringExpression;
}

export interface IBackgroundLayout {
  visibility?: StringExpression;
}

export interface IBackgroundStyle {
  type: 'background';
  paint?: IBackgroundPaint;
  layout?: IBackgroundLayout;
}

/**
 * Create MB layer styles
 */
export function createLayerStyles(
  props: { strokeColor?: string; fillColor?: string; width?: number; radius?: number } = {},
): LayerStyles {
  props = { strokeColor: 'rgba(0, 0, 255, 0.9)', fillColor: 'rgba(127, 127, 255, 0.4)', width: 3, radius: 3, ...props };
  return [
    {
      type: 'circle',
      paint: {
        'circle-color': `${props.fillColor}`,
        'circle-stroke-color': `${props.strokeColor}`,
        'circle-radius': props.radius,
        'circle-stroke-width': props.width,
      },
    },
    {
      type: 'line',
      paint: {
        'line-color': `${props.strokeColor}`,
        'line-cap': 'butt',
        'line-join': 'miter',
        'line-width': props.width,
      },
    },
    {
      type: 'fill',
      paint: {
        'fill-color': `${props.fillColor}`,
      },
    },
  ];
}

/**
 * Apply layer MB styles.
 */
export function createStyleFunction(layerStyles: LayerStyles, olMap?: OlMap) {
  const styleRoot: StyleRoot = {
    layers: layerStyles,
    olMap,
  };
  for (const style of styleRoot.layers) {
    if ('filter' in style) {
      style.filterFunction = LayerStylesFilterUtils.createFilter(style.filter);
    }
  }
  return (feature: any, resolution: number) => {
    return styleFunction(styleRoot, feature, resolution);
  };
}

/**
 * Apply layer MB styles.
 */
export function applyLayerStyles(layer: VectorLayer<any> | VectorTileLayer, layerStyles: LayerStyles, olMap?: OlMap) {
  if (layerStyles == null) {
    layer.setStyle(undefined);
    return;
  }
  layer.setStyle(createStyleFunction(layerStyles, olMap));
}

/**
 * Apply layer MB styles.
 */
export function applyFeatureStyles(feature: Feature<any>, layerStyles: LayerStyles, olMap?: OlMap) {
  if (layerStyles == null) {
    feature.setStyle(undefined);
    return;
  }
  const styleRoot: StyleRoot = {
    layers: layerStyles,
    olMap,
  };
  for (const style of styleRoot.layers) {
    if ('filter' in style) {
      style.filterFunction = LayerStylesFilterUtils.createFilter(style.filter);
    }
  }
  feature.setStyle((feature: any, resolution: number) => {
    return styleFunction(styleRoot, feature, resolution);
  });
}

const stdView = new OlView();
const colorElement = document.createElement('div');
const colorRegEx = /^rgba?\((.*)\)$/;
// Secured regex to capture variables in format {variable}
const templateRegEx = /{\s*([^{}\s]+)\s*}/g;
const types: { [key: string]: number } = {
  Point: 1,
  MultiPoint: 1,
  LineString: 2,
  MultiLineString: 2,
  Polygon: 3,
  MultiPolygon: 3,
};
const filterTypes = ['Unknown', 'Point', 'LineString', 'Polygon'];
const fontRegEx = /[\s,]+/;
const fontWeights: { [key: string]: number } = {
  thin: 100,
  hairline: 100,
  ultralight: 100,
  'ultra-light': 100,
  extralight: 100,
  'extra-light': 100,
  light: 200,
  book: 300,
  regular: 400,
  normal: 400,
  plain: 400,
  roman: 400,
  standard: 400,
  medium: 500,
  semibold: 600,
  'semi-bold': 600,
  demibold: 600,
  'demi-bold': 600,
  bold: 700,
  heavy: 800,
  black: 800,
  extrabold: 800,
  'extra-bold': 800,
  ultrablack: 900,
  'ultra-black': 900,
  extrablack: 900,
  'extra-black': 900,
  ultrabold: 900,
  'ultra-bold': 900,
  heavyblack: 900,
  'heavy-black': 900,
  fat: 900,
  poster: 900,
};

function isString(value: any) {
  return typeof value == 'string';
}

function isBoolean(value: any) {
  return value === true || value === false;
}

function getValue(styleRoot: StyleRoot, object: any, key: string, def?: string | number | boolean): any {
  let val = object[key];
  if (styleRoot.constants != null && isString(val) && val.charAt(0) === '@') {
    const newVal = styleRoot.constants[val];
    if (newVal != null) {
      val = newVal;
      object[key] = newVal;
    }
  }
  if (!isString(val) && !isFinite(val) && !isBoolean(val)) {
    val = null;
    object[key] = null;
  }
  if (val == null && def != null) {
    val = def;
  }
  return val;
}

function getArray(styleRoot: StyleRoot, object: any, key: string, def?: any[]): any[] {
  let val = object[key];
  if (styleRoot.constants != null && isString(val) && val.charAt(0) === '@') {
    const newVal = styleRoot.constants[val];
    if (newVal != null) {
      val = newVal;
      object[key] = newVal;
    }
  }
  if (!Array.isArray(val)) {
    val = null;
    object[key] = null;
  }
  if (val == null && def != null) {
    val = def;
  }
  return val;
}

function computeColor(color: string): [number, number, number, number] {
  colorElement.style.color = color;
  document.body.appendChild(colorElement);
  const colorString = window.getComputedStyle(colorElement).getPropertyValue('color');
  document.body.removeChild(colorElement);
  const colorArray = colorString.match(colorRegEx)[1].split(',').map(Number) as number[];
  if (colorArray.length === 3) {
    // if RGB Color, add opacity
    colorArray.push(1);
  }
  return colorArray as [number, number, number, number];
}

function getColorWithOpacity(styleRoot: StyleRoot, color: string, opacity: number): [number, number, number, number] {
  if (color == null) {
    return null;
  }
  if (styleRoot.cachedColor == null) {
    styleRoot.cachedColor = {};
  }
  let colorArray = styleRoot.cachedColor[color];
  if (!colorArray) {
    colorArray = computeColor(color);
    styleRoot.cachedColor[color] = colorArray;
  }
  let resColor = colorArray.slice(0) as [number, number, number, number];
  if (opacity != null) {
    resColor[3] = resColor[3] * opacity;
  }
  if (resColor[3] === 0) {
    resColor = undefined;
  }
  return resColor;
}

function getTextFromTemplate(text: string, properties: any): string {
  // Replace properties by their values in text
  return text.replace(templateRegEx, (match, propertyKey) => {
    // match = '{propertyKey}', propertyKey = 'propertyKey'
    // If property is found, match is replaced by property value, elsewhere match remains untouched in text
    return properties[propertyKey] !== undefined ? properties[propertyKey] : match;
  });
}

function getFont(styleRoot: StyleRoot, font: string, size: number): string {
  if (Array.isArray(font) && font.length > 0) {
    return getFont(styleRoot, font[0], size);
  } else if (!isString(font)) {
    return '16px sans-serif';
  }
  const parts = font.split(fontRegEx);
  let style;
  let weight;
  let fontFamily = font;
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (style == null && (lower === 'normal' || lower === 'italic' || lower === 'oblique')) {
      style = lower;
      fontFamily = fontFamily.replace(part, '');
    } else if (weight == null && lower in fontWeights) {
      weight = fontWeights[lower];
      fontFamily = fontFamily.replace(part, '');
    }
  }
  if (style == null) {
    style = 'normal';
  }
  if (weight == null) {
    weight = 'normal';
  }
  return `${style} ${weight} ${size}px ${fontFamily}`;
}

function getZoomForResolution(styleRoot: StyleRoot, resolution: number): number {
  if (styleRoot.cachedZoom == null) {
    styleRoot.cachedZoom = {};
  }
  if (styleRoot.cachedZoom[resolution] != null) {
    return styleRoot.cachedZoom[resolution];
  }
  let zoom;
  if (styleRoot.olMap != null) {
    zoom = Math.floor(styleRoot.olMap.getView().getZoomForResolution(resolution));
  } else {
    zoom = Math.floor(stdView.getZoomForResolution(resolution));
  }
  styleRoot.cachedZoom[resolution] = zoom;
  return zoom;
}

function createCircleStyle(styleRoot: StyleRoot, paintLayout: any, feature: any, index: number) {
  return new Style({
    image: new Circle({
      radius: getValue(styleRoot, paintLayout, 'circle-radius', 5),
      stroke: new Stroke({
        color: getColorWithOpacity(
          styleRoot,
          getValue(styleRoot, paintLayout, 'circle-stroke-color', '#000000'),
          getValue(styleRoot, paintLayout, 'circle-stroke-opacity', 1),
        ),
        width: getValue(styleRoot, paintLayout, 'circle-stroke-width', 1),
      }),
      fill: new Fill({
        color: getColorWithOpacity(
          styleRoot,
          getValue(styleRoot, paintLayout, 'circle-color', '#000000'),
          getValue(styleRoot, paintLayout, 'circle-opacity', 1),
        ),
      }),
    }),
    zIndex: index,
  });
}

function createSymbolStyle(styleRoot: StyleRoot, paintLayout: any, feature: any, index: number) {
  let textStyle;
  const textProp = getValue(styleRoot, paintLayout, 'text-field');
  if (textProp != null) {
    textStyle = new Text({
      text: getTextFromTemplate(textProp, feature.getProperties()),
      font: getFont(
        styleRoot,
        getValue(styleRoot, paintLayout, 'text-font', 'sans-serif'),
        getValue(styleRoot, paintLayout, 'text-size', 16),
      ),
      stroke: new Stroke({
        color: getColorWithOpacity(
          styleRoot,
          getValue(styleRoot, paintLayout, 'text-halo-color', '#000000'),
          getValue(styleRoot, paintLayout, 'text-halo-opacity', 0),
        ),
        width: getValue(styleRoot, paintLayout, 'text-halo-width', 0),
      }),
      fill: new Fill({
        color: getColorWithOpacity(
          styleRoot,
          getValue(styleRoot, paintLayout, 'text-color', '#000000'),
          getValue(styleRoot, paintLayout, 'text-opacity', 1),
        ),
      }),
      offsetX: getArray(styleRoot, paintLayout, 'text-offset', [0, 0])[0],
      offsetY: getArray(styleRoot, paintLayout, 'text-offset', [0, 0])[1],
      backgroundFill: getValue(styleRoot, paintLayout, 'background-fill-color')
        ? new Fill({
            color: getColorWithOpacity(
              styleRoot,
              getValue(styleRoot, paintLayout, 'background-fill-color', '#000000'),
              getValue(styleRoot, paintLayout, 'background-fill-opacity', '#000000'),
            ),
          })
        : undefined,
      backgroundStroke: getValue(styleRoot, paintLayout, 'background-stroke-color')
        ? new Stroke({
            color: getColorWithOpacity(
              styleRoot,
              getValue(styleRoot, paintLayout, 'background-stroke-color', '#000000'),
              getValue(styleRoot, paintLayout, 'background-stroke-opacity', 1),
            ),
            width: getValue(paintLayout, 'background-stroke-width', '#000000'),
          })
        : undefined,
      textAlign: getValue(styleRoot, paintLayout, 'text-justify', 'center'),
      textBaseline: getValue(styleRoot, paintLayout, 'text-anchor', 'center'),
      padding: getArray(styleRoot, paintLayout, 'text-padding', [0, 0, 0, 0]),
      placement: getValue(styleRoot, paintLayout, 'text-placement', 'point'),
    });
  }
  let iconStyle;
  const iconProp = getValue(styleRoot, paintLayout, 'icon-image');
  if (iconProp != null) {
    const icon = getTextFromTemplate(iconProp, feature.getProperties());
    iconStyle = new Icon({
      src: icon,
      scale: getValue(styleRoot, paintLayout, 'icon-size', 1),
    });
  }
  return new Style({
    text: textStyle,
    image: iconStyle,
    zIndex: index,
  });
}

function createStrokeStyle(styleRoot: StyleRoot, paintLayout: any, feature: any, index: number) {
  const width = getValue(styleRoot, paintLayout, 'line-width', 1);
  let dashArray = getArray(styleRoot, paintLayout, 'line-dasharray');
  if (dashArray != null) {
    dashArray = dashArray.map((x: any) => x * width);
  }
  return new Style({
    stroke: new Stroke({
      color: getColorWithOpacity(
        styleRoot,
        getValue(styleRoot, paintLayout, 'line-color', '#FFFFFF'),
        getValue(styleRoot, paintLayout, 'line-opacity', 1),
      ),
      width,
      lineCap: getValue(styleRoot, paintLayout, 'line-cap', 'butt'),
      lineJoin: getValue(styleRoot, paintLayout, 'line-join', 'miter'),
      lineDash: dashArray,
      miterLimit: getValue(styleRoot, paintLayout, 'line-miter-limit', 2),
    }),
    zIndex: index,
  });
}

function createFillStyle(styleRoot: StyleRoot, paintLayout: any, feature: any, index: number) {
  return new Style({
    fill: new Fill({
      color: getColorWithOpacity(
        styleRoot,
        getValue(styleRoot, paintLayout, 'fill-color', '#FFFFFF'),
        getValue(styleRoot, paintLayout, 'fill-opacity', 1),
      ),
    }),
    zIndex: index,
  });
}

function styleFunction(styleRoot: StyleRoot, feature: any, resolution: number): any[] {
  const olStyles = [];
  const zoom = getZoomForResolution(styleRoot, resolution);
  let index = 0;
  for (const style of styleRoot.layers) {
    index += 1;
    const paintLayout = { ...style.paint, ...style.layout };
    let traitStyle = true;
    if (style.type === 'background') {
      let bgColor = getValue(styleRoot, paintLayout, 'background-color', '#000000');
      if (getValue(styleRoot, paintLayout, 'visibility', 'visible') === 'none') {
        bgColor = '#000000';
      }
      if (
        styleRoot.olMap != null &&
        styleRoot.olMap.getTargetElement() != null &&
        styleRoot.olMap.get('background-color') !== bgColor
      ) {
        const rgb = `rgb(${getColorWithOpacity(styleRoot, bgColor, 1)})`;
        styleRoot.olMap.getTargetElement().style.backgroundColor = rgb;
        styleRoot.olMap.set('background-color', bgColor);
      }
      traitStyle = false;
    }
    if (getValue(styleRoot, paintLayout, 'visibility', 'visible') === 'none') {
      traitStyle = false;
    }
    if (traitStyle && 'source-layer' in style) {
      const layer = feature.get('layer');
      const sourceLayer = style['source-layer'];
      if (layer !== sourceLayer) {
        traitStyle = false;
      }
    }
    if (traitStyle && 'minzoom' in style) {
      if (zoom < style.minzoom) {
        traitStyle = false;
      }
    }
    if (traitStyle && 'maxzoom' in style) {
      if (zoom > style.maxzoom) {
        traitStyle = false;
      }
    }
    if (traitStyle && 'filterFunction' in style) {
      if (
        !style.filterFunction({
          properties: feature.getProperties(),
          type: types[feature.getGeometry().getType()],
        })
      ) {
        traitStyle = false;
      }
    }
    if (traitStyle) {
      switch (style.type) {
        case 'circle':
          olStyles.push(createCircleStyle(styleRoot, paintLayout, feature, index));
          break;
        case 'symbol':
          olStyles.push(createSymbolStyle(styleRoot, paintLayout, feature, index));
          break;
        case 'line':
          olStyles.push(createStrokeStyle(styleRoot, paintLayout, feature, index));
          break;
        case 'fill':
          olStyles.push(createFillStyle(styleRoot, paintLayout, feature, index));
          break;
        default:
          break;
      }
    }
  }
  return olStyles;
}

class LayerStylesFilterUtils {
  public static createFilter(filter: any) {
    return function (f: any) {
      const p = (f && f.properties) || {};
      return this.evaluateFilter(filter, p, f);
    };
  }

  private static evaluateFilter(filter: any, properties: any, feature: any): boolean {
    if (!filter) {
      return true;
    }
    const op = filter[0];
    if (filter.length <= 1) {
      return op === 'any' ? false : true;
    }
    switch (op) {
      case '==':
        return this.evaluateComparisonOp(properties, filter[1], filter[2], '===');
      case '!=':
        return this.evaluateComparisonOp(properties, filter[1], filter[2], '!==');
      case '<':
        return this.evaluateComparisonOp(properties, filter[1], filter[2], '<');
      case '>':
        return this.evaluateComparisonOp(properties, filter[1], filter[2], '>');
      case '<=':
        return this.evaluateComparisonOp(properties, filter[1], filter[2], '<=');
      case '>=':
        return this.evaluateComparisonOp(properties, filter[1], filter[2], '>=');
      case 'any':
        return filter
          .slice(1)
          .some((subFilter: any) =>
            this.evaluateFilter(subFilter, properties, feature)
          );
      case 'all':
        return filter
          .slice(1)
          .every((subFilter: any) =>
            this.evaluateFilter(subFilter, properties, feature)
          );
      case 'none':
        return !filter
          .slice(1)
          .some((subFilter: any) =>
            this.evaluateFilter(subFilter, properties, feature)
          );
      case 'in':
        return this.evaluateInOp(properties, filter[1], filter.slice(2));
      case '!in':
        return !this.evaluateInOp(properties, filter[1], filter.slice(2));
      case 'has':
        return this.evaluateHasOp(properties, filter[1]);
      case '!has':
        return !this.evaluateHasOp(properties, filter[1]);
      default:
        return true;
    }
  }

  private static evaluateComparisonOp(
    properties: any,
    property: any,
    value: any,
    op: string
  ): boolean {
    const left = this.getPropertyReference(properties, property);
    const right = property === '$type' ? filterTypes.indexOf(value) : value;
    switch (op) {
      case '===':
        return left === right;
      case '!==':
        return left !== right;
      case '<':
        return left < right;
      case '>':
        return left > right;
      case '<=':
        return left <= right;
      case '>=':
        return left >= right;
      default:
        return false;
    }
  }

  private static getPropertyReference(properties: any, property: any) {
    return property === '$type'
      ? properties.type
      : property === '$id'
      ? properties.id
      : properties[property];
  }

  private static evaluateInOp(properties: any, property: any, values: any): boolean {
    const value = this.getPropertyReference(properties, property);
    return values.includes(value);
  }

  private static evaluateHasOp(properties: any, property: any): boolean {
    return property === '$id' ? 'id' in properties : property in properties;
  }
}
