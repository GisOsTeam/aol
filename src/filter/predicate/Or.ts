import { FilterBuilderType } from '../IFilter';
import { IOperator, Or as OrOp } from '../operator';
import { BasePredicate } from './BasePredicate';
import { IPredicate } from './IPredicate';

export class Or<LP extends IPredicate, RP extends IPredicate> extends BasePredicate<LP, OrOp, RP> {
  constructor(leftHand: LP, rightHand: RP) {
    super(leftHand, new OrOp(), rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.leftHand.toString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.rightHand.toString(type);
  }
}
