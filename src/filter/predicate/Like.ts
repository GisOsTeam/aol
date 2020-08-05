import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { Like as LikeOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class Like<T> extends FilterPredicate<T, LikeOp> {
  constructor(leftHand: IField<T>, operator: LikeOp, rightHand: FilterValueType) {
    super(leftHand, operator, rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }
}
