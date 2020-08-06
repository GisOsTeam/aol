import { FieldTypeEnum, FilterBuilderType, FilterBuilderTypeEnum, FilterValueType, IField } from '../IFilter';
import { IOperator } from '../operator';
import { BasePredicate } from './BasePredicate';

export abstract class FilterPredicate<T, O extends IOperator = IOperator> extends BasePredicate<
  IField<T>,
  O,
  FilterValueType
> {
  protected constructor(leftHand: IField<T>, operator: O, rightHand: FilterValueType) {
    super(leftHand, operator, rightHand);
  }

  protected defaultLeftHandString(type: FilterBuilderType): string {
    switch (type) {
      case FilterBuilderTypeEnum.CQL:
        switch (this.leftHand.type) {
          case FieldTypeEnum.Number:
          case FieldTypeEnum.Boolean:
            return `${this.leftHand.key}`;
          default:
            return `Concatenate(${this.leftHand.key})`;
        }
      default:
        return `${this.leftHand.key}`;
    }
  }

  protected defaultRightHandString(): string {
    switch (typeof this.rightHand) {
      case 'string':
        return `'${this.rightHand}'`;
      default:
        return `${this.rightHand}`;
    }
  }
}
