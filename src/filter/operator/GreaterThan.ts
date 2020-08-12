import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class GreaterThan implements IOperator {
  public readonly not: boolean;
  public readonly type: OperatorType = OperatorEnum.equal;

  constructor() {
    this.not = false;
  }

  public toString(): string {
    return '>';
  }
}
