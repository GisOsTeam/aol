import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class In implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.in;

  constructor(not = false) {
    this.not = not;
  }

  public toString(): string {
    if (this.not) {
      return 'NOT IN';
    }
    return 'IN';
  }
}
