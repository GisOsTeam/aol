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

  protected buildOgcString(): string {
    const tag = this.operator.toString(FilterBuilderTypeEnum.OGC);
    const core = `<${tag}>${this.leftHand.toString(FilterBuilderTypeEnum.OGC)}${this.rightHand.toString(
      FilterBuilderTypeEnum.OGC,
    )}</${tag}>`;
    return wrapFesNot(core, this.operator.not);
  }
}
