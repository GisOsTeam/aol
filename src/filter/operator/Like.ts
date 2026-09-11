import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class Like implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.like;

  constructor(not = false) {
    this.not = not;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.OGC) {
      return 'fes:PropertyIsLike';
    }
    if (this.not) {
      return 'NOT LIKE';
    }
    return 'LIKE';
  }
}
