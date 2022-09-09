import { FilterBuilderType, FilterBuilderTypeEnum, FilterValueType, IField } from '../IFilter';
import { Ilike as IlikeOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class Ilike<T> extends FilterPredicate<T, IlikeOp> {
  constructor(leftHand: IField<T>, operator: IlikeOp, rightHand: FilterValueType) {
    super(leftHand, operator, rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    if (type === FilterBuilderTypeEnum.SQL) {
      return `UPPER(${String(this.leftHand.key)})`;
    }
    return this.defaultLeftHandString(type);
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    switch (type) {
      case FilterBuilderTypeEnum.SQL:
        if (typeof this.rightHand === 'number') {
          return `${this.rightHand}`;
        } else if (typeof this.rightHand === 'string') {
          return `'${this.rightHand.toUpperCase()}'`;
        } else {
          throw new Error('Unsupported value type for ilike operator');
        }
      default:
        return this.defaultRightHandString();
    }
  }
}
