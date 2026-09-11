import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { AndOp } from '../operator';
import { wrapFesNot } from '../fes';
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

  protected buildOgcString(): string {
    const tag = this.operator.toString(FilterBuilderTypeEnum.OGC);
    const core = `<${tag}>${this.leftHand.toString(FilterBuilderTypeEnum.OGC)}${this.rightHand.toString(
      FilterBuilderTypeEnum.OGC,
    )}</${tag}>`;
    return wrapFesNot(core, this.operator.not);
  }
}
