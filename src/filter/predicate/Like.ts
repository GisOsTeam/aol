import { FilterBuilderType, FilterBuilderTypeEnum, FilterValueType, IField } from '../IFilter';
import { Like as LikeOp } from '../operator';
import { buildFesLiteral, wrapFesNot } from '../fes';
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

  protected buildOgcString(): string {
    const tag = this.operator.toString(FilterBuilderTypeEnum.OGC);
    const core = `<${tag} wildCard="%" singleChar="_" escapeChar="\\" matchCase="true">${this.defaultLeftHandString(
      FilterBuilderTypeEnum.OGC,
    )}${buildFesLiteral(this.rightHand)}</${tag}>`;
    return wrapFesNot(core, this.operator.not);
  }
}
