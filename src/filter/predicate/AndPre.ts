import { FilterBuilderType } from '../IFilter';
import { AndOp } from '../operator';
import { BasePredicate } from './BasePredicate';
import { IPredicate } from './IPredicate';

export class AndPre extends BasePredicate<IPredicate, AndOp, IPredicate> {
  constructor(leftHand: IPredicate, rightHand: IPredicate) {
    super(leftHand, new AndOp(), rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.leftHand.toString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.rightHand.toString(type);
  }
}
