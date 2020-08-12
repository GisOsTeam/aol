import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class GreaterThan implements IOperator {
  public readonly not: boolean;
  public readonly type: OperatorType = OperatorEnum.greaterThan;

  constructor() {
    this.not = false;
  }

  public toString(): string {
    return '>';
  }
}
