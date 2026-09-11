import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class Equal implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.equal;

  constructor(not = false) {
    this.not = not;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.OGC) {
      return 'fes:PropertyIsEqualTo';
    }
    if (this.not) {
      return '<>';
    } else {
      return '=';
    }
  }
}
