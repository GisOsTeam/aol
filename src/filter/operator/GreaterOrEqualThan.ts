import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class GreaterOrEqualThan implements IOperator {
  public readonly not: boolean;
  public readonly type: OperatorType = OperatorEnum.greaterOrEqualThan;

  constructor() {
    this.not = false;
  }

  public toString(): string {
    return '>=';
  }
}
