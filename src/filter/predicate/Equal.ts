import { FieldTypeEnum, FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { Equal as EqualOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class Equal<T> extends FilterPredicate<T> {
  constructor(leftHand: IField<T>, operator: EqualOp, rightHand: FilterValueType) {
    super(leftHand, operator, rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    if (
      (typeof this.rightHand === 'number' || typeof this.rightHand === 'boolean') &&
      (this.leftHand.type === FieldTypeEnum.Number || this.leftHand.type === FieldTypeEnum.Boolean)
    ) {
      return `${this.rightHand}`;
    }
    return `'${this.rightHand}'`;
  }
}
