import {
  FieldType,
  FieldTypeEnum,
  FilterBuilderType,
  FilterBuilderTypeEnum,
  IField,
  IFilter,
  Predicate,
} from './IFilter';
import { OperatorEnum } from './operator';

export class FilterBuilder {
  public static build(filters: IFilter[], type: FilterBuilderType): string {
    const predicates: Predicate[] = [];
    if (filters != null) {
      filters.forEach((filter: IFilter) => {
        let fieldKey = filter.field.key;
        const operatorAsString = filter.operator.toString(type);
        const fieldType = this.retrieveFieldType(filter.field, filter.value);

        let value = filter.value;
        if (filter.operator.type === OperatorEnum.in) {
          value = (value as any[]).map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(',');
        } else if (filter.operator.type === OperatorEnum.ilike) {
          if (type === FilterBuilderTypeEnum.SQL) {
            fieldKey = `UPPER(${fieldKey})`;
            value = (value as string).toUpperCase();
          }
        }
        predicates.push(this.generatePredicate(type, fieldKey, fieldType, value, operatorAsString));
      });
    }
    if (predicates.length === 0) {
      return 'INCLUDE';
    }
    return predicates.join(' && ');
  }

  private static generatePredicate(
    type: string,
    fieldKey: string,
    fieldType: string,
    value: string | number | boolean | any[],
    cqlSqlOperator: string
  ): string {
    if (
      (typeof value === 'number' || typeof value === 'boolean') &&
      (fieldType === FieldTypeEnum.Number || fieldType === FieldTypeEnum.Boolean) &&
      (cqlSqlOperator === '=' || cqlSqlOperator === '!=')
    ) {
      return `(${fieldKey} ${cqlSqlOperator} ${value})`;
    } else {
      if ('IN' === cqlSqlOperator || 'NOT IN' === cqlSqlOperator) {
        return `(${fieldKey} ${cqlSqlOperator} (${value}))`;
      } else if (type === 'cql') {
        fieldKey = `Concatenate(${fieldKey})`;
      }
      return `(${fieldKey} ${cqlSqlOperator} '${value}')`;
    }
  }

  private static retrieveFieldType(field: IField, value: any): FieldType {
    if (!field.type && typeof value === 'number') {
      return FieldTypeEnum.Number;
    }
    if (!field.type && typeof value === 'boolean') {
      return FieldTypeEnum.Boolean;
    }
    if (!!field.type) {
      return field.type;
    }
    return FieldTypeEnum.Unknown;
  }
}
