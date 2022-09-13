import { FilterBuilderType, IField } from '../IFilter';
import { Null as NullOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class Null<T> extends FilterPredicate<T, NullOp> {
  constructor(leftHand: IField<T>, operator: NullOp) {
    super(leftHand, operator, undefined);
  }

  public toString(type?: FilterBuilderType): string {
    return `(${this.buildLeftHandString(type)} ${this.operator.toString()})`;
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    return this.defaultRightHandString();
  }
}
