import { FilterBuilderType, FilterBuilderTypeEnum, IField } from '../IFilter';
import { Null as NullOp } from '../operator';
import { wrapFesNot } from '../fes';
import { FilterPredicate } from './FilterPredicate';

export class Null<T> extends FilterPredicate<T, NullOp> {
  constructor(leftHand: IField<T>, operator: NullOp) {
    super(leftHand, operator, undefined);
  }

  public toString(type?: FilterBuilderType): string {
    if (type === FilterBuilderTypeEnum.FES) {
      return this.buildFesString();
    }
    return `(${this.buildLeftHandString(type)} ${this.operator.toString()})`;
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }

  protected buildFesString(): string {
    const tag = this.operator.toString(FilterBuilderTypeEnum.FES);
    const core = `<${tag}>${this.defaultLeftHandString(FilterBuilderTypeEnum.FES)}</${tag}>`;
    return wrapFesNot(core, this.operator.not);
  }
}
