import { FilterBuilderType, FilterBuilderTypeEnum, FilterValueType, IField } from '../IFilter';
import { In as InOp } from '../operator';
import { buildFesLiteral, wrapFesNot } from '../fes';
import { FilterPredicate } from './FilterPredicate';

export class In<T> extends FilterPredicate<T, InOp> {
  constructor(leftHand: IField<T>, operator: InOp, rightHand: FilterValueType) {
    super(leftHand, operator, rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return `${String(this.leftHand.key)}`;
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    try {
      return `(${(this.rightHand as any[]).map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(',')})`;
    } catch (e) {
      return `(${this.rightHand})`;
    }
  }

  /**
   * FES 2.0 has no direct "property in list" comparison operator, so IN is rendered as
   * an OR of PropertyIsEqualTo (one per value), negated with fes:Not for NOT IN.
   */
  protected buildFesString(): string {
    let values: any[];
    if (Array.isArray(this.rightHand)) {
      values = this.rightHand;
    } else if (typeof this.rightHand === 'string') {
      // Mirrors the CQL/SQL rendering, which accepts a raw comma-separated id list
      // (e.g. '1,2,3') relying on the SQL "IN (...)" syntax to parse it. FES has no
      // such syntax, so each id must become its own PropertyIsEqualTo comparison.
      values = this.rightHand.split(',').map((v) => v.trim());
    } else {
      values = [this.rightHand];
    }
    const valueReference = this.defaultLeftHandString(FilterBuilderTypeEnum.FES);
    const comparisons = values.map(
      (v) => `<fes:PropertyIsEqualTo>${valueReference}${buildFesLiteral(v)}</fes:PropertyIsEqualTo>`,
    );
    const core = comparisons.length > 1 ? `<fes:Or>${comparisons.join('')}</fes:Or>` : comparisons.join('');
    return wrapFesNot(core, this.operator.not);
  }
}
