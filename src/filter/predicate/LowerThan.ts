import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { LowerThan as LowerThanOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class LowerThan<T = any> extends FilterPredicate<T> {
  constructor(leftHand: IField<T>, rightHand: FilterValueType) {
    super(leftHand, new LowerThanOp(), rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }
}
