import { IOperator } from './operator';

export enum FieldTypeEnum {
  Oid = 'Oid',
  Boolean = 'Boolean',
  Number = 'Number',
  String = 'String',
  Date = 'Date',
  Geometry = 'Geometry',
  Unknown = 'Unknown',
}

export type FieldType =
  | FieldTypeEnum.Oid
  | FieldTypeEnum.Boolean
  | FieldTypeEnum.Number
  | FieldTypeEnum.String
  | FieldTypeEnum.Date
  | FieldTypeEnum.Geometry
  | FieldTypeEnum.Unknown;

export interface IField<T> {
  key: keyof T;
  type: FieldType;
  alias?: string;
}

export interface IFilter<T> {
  field: IField<T>;
  operator: IOperator;
  not: boolean;
  value: string | number | boolean | any[];
}

export type Predicate = string;

export enum FilterBuilderTypeEnum {
  CQL = 'CQL',
  SQL = 'SQL',
  OGC = 'OGC',
}

export type FilterBuilderType = FilterBuilderTypeEnum.CQL | FilterBuilderTypeEnum.SQL | FilterBuilderTypeEnum.OGC;
