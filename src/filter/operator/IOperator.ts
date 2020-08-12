import { FilterBuilderType } from '../IFilter';

export interface IOperator {
  not: boolean;

  type: OperatorType;

  toString(filterBuilderType?: FilterBuilderType): string;
}

export enum OperatorEnum {
  and = 'and',
  equal = 'equal',
  greaterThan = 'greaterThan',
  greaterOrEqualThan = 'greaterOrEqualThan',
  ilike = 'ilike',
  in = 'in',
  like = 'like',
  lowerThan = 'lowerThan',
  lowerOrEqualThan = 'lowerOrEqualThan',
  null = 'null',
  or = 'or',
}

export type OperatorType =
  | OperatorEnum.and
  | OperatorEnum.equal
  | OperatorEnum.ilike
  | OperatorEnum.in
  | OperatorEnum.like
  | OperatorEnum.or
  | string;
