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
        throw new Error('Unsupported value type for And operator');
      default:
        if (this.not) {
          return 'AND NOT';
        }
        return 'AND';
    }
  }
}
