import { FilterBuilderType } from '../IFilter';
import { AndOp } from '../operator';
import { BasePredicate } from './BasePredicate';

export class AndPre extends BasePredicate<BasePredicate<any, any, any>, AndOp, BasePredicate<any, any, any>> {
  constructor(leftHand: BasePredicate<any, any, any>, rightHand: BasePredicate<any, any, any>) {
    super(leftHand, new AndOp(), rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.leftHand.toString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.rightHand.toString(type);
  }
}
