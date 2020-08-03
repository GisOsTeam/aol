import { FilterBuilderType } from '../IFilter';

export interface IOperator {
  not: boolean;

  type: OperatorType;

  toString(filterBuilderType?: FilterBuilderType): string
}

export enum OperatorEnum {
  equal = 'equal',
  ilike = 'ilike',
  in = 'in',
  like = 'like'
}

export type OperatorType = OperatorEnum.equal | OperatorEnum.ilike | OperatorEnum.in | OperatorEnum.like | string;
