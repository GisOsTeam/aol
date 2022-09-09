import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { In as InOp } from '../operator';
import { FilterPredicate } from './FilterPredicate';

export class In<T> extends FilterPredicate<T, InOp> {
  constructor(leftHand: IField<T>, operator: InOp, rightHand: FilterValueType) {
    super(leftHand, operator, rightHand);
  }

  protected buildLeftHandString(type: FilterBuilderType): string {
    return `${String(this.leftHand.key)}`;
  }

  protected buildRightHandString(type: FilterBuilderType): string {
    try {
      return `(${(this.rightHand as any[]).map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(',')})`;
    } catch (e) {
      return `(${this.rightHand})`;
    }
  }
}
