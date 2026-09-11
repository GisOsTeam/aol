import { FieldTypeEnum, FilterBuilderType, FilterBuilderTypeEnum, FilterValueType, IField } from '../IFilter';
import { IOperator } from '../operator';
import { buildFesLiteral, buildFesValueReference, wrapFesNot } from '../fes';
import { BasePredicate } from './BasePredicate';

export abstract class FilterPredicate<T, O extends IOperator = IOperator> extends BasePredicate<
  IField<T>,
  O,
  FilterValueType
> {
  protected constructor(leftHand: IField<T>, operator: O, rightHand: FilterValueType) {
    super(leftHand, operator, rightHand);
  }

  protected defaultLeftHandString(type: FilterBuilderType): string {
    switch (type) {
      case FilterBuilderTypeEnum.CQL:
        switch (this.leftHand.type) {
          case FieldTypeEnum.Number:
          case FieldTypeEnum.Boolean:
            return `${String(this.leftHand.key)}`;
          default:
            return `Concatenate(${String(this.leftHand.key)})`;
        }
      case FilterBuilderTypeEnum.OGC:
        return buildFesValueReference(String(this.leftHand.key));
      default:
        return `${String(this.leftHand.key)}`;
    }
  }

  protected defaultRightHandString(type?: FilterBuilderType): string {
    switch (typeof this.rightHand) {
      case 'string':
        return `'${this.rightHand}'`;
      default:
        return `${this.rightHand}`;
    }
  }

  /**
   * Default FES 2.0 rendering for a simple comparison predicate:
   * <fes:{Operator}><fes:ValueReference>...</fes:ValueReference><fes:Literal>...</fes:Literal></fes:{Operator}>
   * wrapped in <fes:Not> when the operator is negated.
   * Predicates whose FES encoding differs (Null, In, Like/Ilike, logical combinators, ...) override this.
   */
  protected buildOgcString(): string {
    const tag = this.operator.toString(FilterBuilderTypeEnum.OGC);
    const core = `<${tag}>${this.defaultLeftHandString(FilterBuilderTypeEnum.OGC)}${buildFesLiteral(
      this.rightHand,
    )}</${tag}>`;
    return wrapFesNot(core, this.operator.not);
  }
}
