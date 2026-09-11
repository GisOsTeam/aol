import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class Null implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.null;

  constructor(not = false) {
    this.not = not;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.OGC) {
      return 'fes:PropertyIsNull';
    }
    if (this.not) {
      return 'IS NOT NULL';
    }
    return 'IS NULL';
  }
}
