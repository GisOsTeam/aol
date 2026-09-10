import { IOperator, OperatorEnum, OperatorType } from './IOperator';
import { FilterBuilderTypeEnum } from '../IFilter';

export class AndOp implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.and;

  constructor(not = false) {
    this.not = not;
  }

  public toString(type?: FilterBuilderTypeEnum): string {
    switch (type) {
      case FilterBuilderTypeEnum.OGC:
        return 'fes:And';
      default:
        if (this.not) {
          return 'AND NOT';
        }
        return 'AND';
    }
  }
}
