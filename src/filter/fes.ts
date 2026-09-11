import { FilterValueType } from './IFilter';

/**
 * Helpers to build OGC Filter Encoding Standard 2.0 (FES, OGC 09-026r2) XML fragments,
 * the filter language used inside a WFS 2.0.0 GetFeature request (<fes:Filter>).
 *
 * Each predicate/operator only renders its own fragment (e.g. <fes:PropertyIsEqualTo>...</fes:PropertyIsEqualTo>);
 * wrapping the result in a <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" ...> root element is left
 * to the caller building the full GetFeature request.
 */

export function escapeXmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value).replace(/"/g, '&quot;');
}

export function buildFesValueReference(propertyName: string): string {
  return `<fes:ValueReference>${escapeXmlText(propertyName)}</fes:ValueReference>`;
}

export function buildFesLiteral(value: FilterValueType): string {
  return `<fes:Literal>${escapeXmlText(String(value))}</fes:Literal>`;
}

export function wrapFesNot(xml: string, not: boolean): string {
  return not ? `<fes:Not>${xml}</fes:Not>` : xml;
}

/**
 * GML 3.2 (ISO 19136) is the geometry encoding WFS 2.0.0 / FES 2.0 pair with.
 * Fragments carry it as a self-declared default namespace (xmlns="...") rather than a
 * "gml:" prefix, so they stay valid XML on their own regardless of what the caller
 * declares on the surrounding <fes:Filter> root.
 */
export const GML32_NAMESPACE = 'http://www.opengis.net/gml/3.2';
