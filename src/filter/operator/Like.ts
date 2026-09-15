import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from './IOperator';
import { getFesOperatorTag } from '../fes';

export class Like implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.like;

  constructor(not = false) {
    this.not = not;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.FES) {
      return getFesOperatorTag(this.type);
    }
    if (this.not) {
      return 'NOT LIKE';
    }
    return 'LIKE';
  }
}
