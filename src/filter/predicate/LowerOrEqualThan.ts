import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { LowerOrEqualThan as LowerOrEqualThanOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class LowerOrEqualThan<T = any> extends FilterPredicate<T> {
  constructor(leftHand: IField<T>, rightHand: FilterValueType) {
    super(leftHand, new LowerOrEqualThanOp(), rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }
}
