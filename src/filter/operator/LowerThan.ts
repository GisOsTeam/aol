import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class LowerThan implements IOperator {
  public readonly not: boolean;
  public readonly type: OperatorType = OperatorEnum.lowerThan;

  constructor() {
    this.not = false;
  }

  public toString(): string {
    return '<';
  }
}
