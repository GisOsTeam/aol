import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class LowerOrEqualThan implements IOperator {
  public readonly not: boolean;
  public readonly type: OperatorType = OperatorEnum.lowerOrEqualThan;

  constructor() {
    this.not = false;
  }

  public toString(): string {
    return '<=';
  }
}
