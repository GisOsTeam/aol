import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { GreaterOrEqualThan as GreaterOrEqualThanOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class GreaterOrEqualThan<T = any> extends FilterPredicate<T> {
  constructor(leftHand: IField<T>, rightHand: FilterValueType) {
    super(leftHand, new GreaterOrEqualThanOp(), rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }
}
