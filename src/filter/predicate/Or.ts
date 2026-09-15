import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { Or as OrOp } from '../operator';
import { wrapFesNot } from '../fes';
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

  protected buildFesString(): string {
    const tag = this.operator.toString(FilterBuilderTypeEnum.FES);
    const core = `<${tag}>${this.leftHand.toString(FilterBuilderTypeEnum.FES)}${this.rightHand.toString(
      FilterBuilderTypeEnum.FES,
    )}</${tag}>`;
    return wrapFesNot(core, this.operator.not);
  }
}
