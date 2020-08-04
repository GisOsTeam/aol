import { FieldTypeEnum, FilterBuilderType, FilterBuilderTypeEnum, IField, IFilter, IPredicate } from './IFilter';
import { IOperator, OperatorEnum } from './operator';

export class Predicate<T> implements IPredicate<T> {
  public field: IField<T>;
  public operator: IOperator;
  public value: string | number | boolean | any[];

  constructor(filter: IFilter<T>) {
    this.field = filter.field;
    this.operator = filter.operator;
    this.value = filter.value;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (
      (typeof this.value === 'number' || typeof this.value === 'boolean') &&
      (this.field.type === FieldTypeEnum.Number || this.field.type === FieldTypeEnum.Boolean) &&
      this.operator.type === OperatorEnum.equal
    ) {
      return `(${this.field.key} ${this.operator.toString(filterBuilderType)} ${this.getValue(filterBuilderType)})`;
    } else {
      if (this.operator.type === OperatorEnum.in) {
        return `(${this.field.key} ${this.operator.toString(filterBuilderType)} (${this.getValue(filterBuilderType)}))`;
      } else if (filterBuilderType === FilterBuilderTypeEnum.CQL) {
        this.field.key = `Concatenate(${this.field.key})`;
      } else if (this.operator.type === OperatorEnum.ilike) {
        if (filterBuilderType === FilterBuilderTypeEnum.SQL) {
          this.field.key = `UPPER(${this.field.key})`;
        }
      }
      return `(${this.field.key} ${this.operator.toString(filterBuilderType)} '${this.getValue(filterBuilderType)}')`;
    }
  }

  private getValue(filterBuilderType?: FilterBuilderType): string | number | boolean | any[] {
    if (this.operator.type === OperatorEnum.in) {
      return (this.value as any[]).map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(',');
    } else if (this.operator.type === OperatorEnum.ilike) {
      if (filterBuilderType === FilterBuilderTypeEnum.SQL) {
        if (typeof this.value === 'number') {
          return `${this.value}`.toLowerCase();
        } else if (typeof this.value === 'string') {
          return this.value.toUpperCase();
        } else {
          console.error('unsupported value type for ilike operator');
        }
      }
    }
    return this.value;
  }
}
