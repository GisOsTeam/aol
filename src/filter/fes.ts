import { FilterValueType } from './IFilter';
// Imported directly from IOperator.ts (not the './operator' barrel) to avoid a circular
// import: operator classes import getFesOperatorTag from this file.
import { OperatorEnum, OperatorType } from './operator/IOperator';

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

/**
 * Single source of truth for "which FES 2.0 element does this operator render as".
 * Always a fixed tag per operator type: negation is never encoded here - it is handled
 * uniformly by wrapping the rendered predicate in <fes:Not> (see wrapFesNot above), so this
 * map (and getFesOperatorTag) never needs to look at an operator's `not` flag.
 *
 * OperatorEnum.in is intentionally absent: FES has no direct "property in list" comparison,
 * so In predicates render as an <fes:Or> of <fes:PropertyIsEqualTo> instead (see In.ts) and
 * never call getFesOperatorTag.
 */
const FES_OPERATOR_TAGS: Partial<Record<OperatorType, string>> = {
  [OperatorEnum.equal]: 'fes:PropertyIsEqualTo',
  [OperatorEnum.greaterThan]: 'fes:PropertyIsGreaterThan',
  [OperatorEnum.greaterOrEqualThan]: 'fes:PropertyIsGreaterThanOrEqualTo',
  [OperatorEnum.lowerThan]: 'fes:PropertyIsLessThan',
  [OperatorEnum.lowerOrEqualThan]: 'fes:PropertyIsLessThanOrEqualTo',
  [OperatorEnum.like]: 'fes:PropertyIsLike',
  [OperatorEnum.ilike]: 'fes:PropertyIsLike',
  [OperatorEnum.null]: 'fes:PropertyIsNull',
  [OperatorEnum.and]: 'fes:And',
  [OperatorEnum.or]: 'fes:Or',
  [OperatorEnum.BBOX]: 'fes:BBOX',
  [OperatorEnum.Contains]: 'fes:Contains',
  [OperatorEnum.Disjoint]: 'fes:Disjoint',
  [OperatorEnum.Intersects]: 'fes:Intersects',
  [OperatorEnum.Within]: 'fes:Within',
};

export function getFesOperatorTag(operatorType: OperatorType): string {
  const tag = FES_OPERATOR_TAGS[operatorType];
  if (!tag) {
    throw new Error(`No FES 2.0 tag registered for operator type "${operatorType}"`);
  }
  return tag;
}
