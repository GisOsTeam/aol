import { FilterBuilderType, FilterBuilderTypeEnum, IField } from '../IFilter';
import { Null as NullOp } from '../operator';
import { wrapFesNot } from '../fes';
import { FilterPredicate } from './FilterPredicate';

export class Null<T> extends FilterPredicate<T, NullOp> {
  constructor(leftHand: IField<T>, operator: NullOp) {
    super(leftHand, operator, undefined);
  }

  public toString(type?: FilterBuilderType): string {
    if (type === FilterBuilderTypeEnum.OGC) {
      return this.buildOgcString();
    }
    return `(${this.buildLeftHandString(type)} ${this.operator.toString()})`;
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }

  protected buildOgcString(): string {
    const tag = this.operator.toString(FilterBuilderTypeEnum.OGC);
    const core = `<${tag}>${this.defaultLeftHandString(FilterBuilderTypeEnum.OGC)}</${tag}>`;
    return wrapFesNot(core, this.operator.not);
  }
}
