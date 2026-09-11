import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from './IOperator';
import { getFesOperatorTag } from '../fes';

export class Null implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.null;

  constructor(not = false) {
    this.not = not;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.OGC) {
      return getFesOperatorTag(this.type);
    }
    if (this.not) {
      return 'IS NOT NULL';
    }
    return 'IS NULL';
  }
}
