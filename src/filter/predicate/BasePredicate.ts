import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { IOperator } from '../operator';
import { IPredicate } from './IPredicate';
import { hash64 } from '../../utils';

export abstract class BasePredicate<
  LH extends IPredicate | IField<any>,
  O extends IOperator,
  RH extends IPredicate | FilterValueType,
> implements IPredicate<LH, O, RH>
{
  public readonly leftHand: LH;
  public readonly operator: O;
  public readonly rightHand: RH;

  protected constructor(leftHand: LH, operator: O, rightHand: RH) {
    this.leftHand = leftHand;
    this.operator = operator;
    this.rightHand = rightHand;
  }

  public toString(type?: FilterBuilderType): string {
    return `(${this.buildLeftHandString(type)} ${this.operator.toString(type)} ${this.buildRightHandString(type)})`;
  }

  public hashCode(): string {
    return hash64(this.toString());
  }

  protected abstract buildLeftHandString(type: FilterBuilderType): string;

  protected abstract buildRightHandString(type: FilterBuilderType): string;
}
