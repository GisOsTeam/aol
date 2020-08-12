import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { GreaterThan as GreaterThanOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class GreaterThan<T = any> extends FilterPredicate<T> {
  constructor(leftHand: IField<T>, rightHand: FilterValueType) {
    super(leftHand, new GreaterThanOp(), rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }
}
