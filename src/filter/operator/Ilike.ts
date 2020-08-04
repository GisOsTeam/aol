import { IOperator, OperatorEnum, OperatorType } from './IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';

export class Ilike implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.like;

  constructor(not = false) {
    this.not = not;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.SQL) {
      if (this.not) {
        return 'NOT LIKE';
      }
      return 'LIKE';
    }

    if (this.not) {
      return 'NOT ILIKE';
    }
    return 'ILIKE';
  }
}
