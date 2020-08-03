import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class In implements IOperator {
  public not: boolean = false;
  public readonly type: OperatorType = OperatorEnum.in;

  constructor(not: boolean) {
    this.not = not;
  }

  public toString(): string {
    if (this.not) {
      return 'NOT IN';
    }
    return 'IN';
  }
}
