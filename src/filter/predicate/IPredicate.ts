import { IOperator } from '../operator';
import { FilterBuilderType, FilterValueType, IField } from '../IFilter';

export interface IPredicate<
  LH extends IPredicate<any, any, any> | IField<any>,
  O extends IOperator,
  RH extends IPredicate<any, any, any> | FilterValueType
> {
  leftHand: LH;
  operator: O;
  rightHand: RH;
  toString(filterBuilderType?: FilterBuilderType): string;
}
