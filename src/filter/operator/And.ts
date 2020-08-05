import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class And implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.and;

  constructor(not = false) {
    this.not = not;
  }

  public toString(): string {
    if (this.not) {
      return '&& !';
    }
    return '&&';
  }
}
