import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { Null as NullOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class Null<T> extends FilterPredicate<T, NullOp> {
  constructor(leftHand: IField<T>, operator: NullOp, rightHand: FilterValueType) {
    super(leftHand, operator, rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }
}
