import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class GreaterThan implements IOperator {
  public readonly not: boolean;
  public readonly type: OperatorType = OperatorEnum.greaterThan;

  constructor() {
    this.not = false;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.OGC) {
      return 'fes:PropertyIsGreaterThan';
    }
    return '>';
  }
}
