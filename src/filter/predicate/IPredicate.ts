import { IOperator } from '../operator';
import { FilterBuilderType, FilterValueType, IField } from '../IFilter';

export interface IPredicate<
  LH extends IPredicate | IField<any> = any,
  O extends IOperator = IOperator,
  RH extends IPredicate | FilterValueType = any
> {
  leftHand: LH;
  operator: O;
  rightHand: RH;

  toString(filterBuilderType?: FilterBuilderType): string;

  hashCode(): string;
}
