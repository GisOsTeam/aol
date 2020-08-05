import { IOperator } from '../operator';
import { FilterBuilderType, FilterValueType, IField } from '../IFilter';

export interface IPredicate<
  LH extends IPredicate<unknown, unknown, unknown> | IField<unknown>,
  O extends IOperator,
  RH extends IPredicate<unknown, unknown, unknown> | FilterValueType
> {
  leftHand: LH;
  operator: O;
  rightHand: RH;
  toString(filterBuilderType?: FilterBuilderType): string;
}
