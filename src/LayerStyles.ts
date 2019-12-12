export type LayerStyles = SingleLayerStyle[];

export type SingleLayerStyle = ILineStyle | IFillStyle | ICircleStyle | ITextStyle | IIconStyle | ISymbolStyle;

export type Expression = Array<any>;

export type NumberExpression = number | Expression;

export type StringExpression = string | Expression;

export interface IGeneralStyle {
  id?: string;
  source?: string;
  'source-layer'?: string;
  minzoom?: number;
  maxzoom?: number;
  filter?: Expression;
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

export interface ITextPaint {}

export interface ITextLayout {
  visibility?: StringExpression;
  'text-field'?: StringExpression;
  'text-font'?: StringExpression;
  'text-size'?: NumberExpression;
  'text-halo-color'?: StringExpression;
  'text-halo-opacity'?: NumberExpression;
  'text-halo-width'?: NumberExpression;
  'text-color'?: StringExpression;
  'text-opacity'?: NumberExpression;
  'text-offset'?: [NumberExpression, NumberExpression];
}

export interface ITextStyle extends IGeneralStyle {
  type: 'text';
  paint?: ITextPaint;
  layout?: ITextLayout;
}

export interface IIconPaint {}

export interface IIconLayout {
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
