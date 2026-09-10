import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class GreaterOrEqualThan implements IOperator {
  public readonly not: boolean;
  public readonly type: OperatorType = OperatorEnum.greaterOrEqualThan;

  constructor() {
    this.not = false;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if ((filterBuilderType = FilterBuilderTypeEnum.OGC)) {
      return 'fes:PropertyIsGreaterThanOrEqualTo';
    }
    return '>=';
  }
}
