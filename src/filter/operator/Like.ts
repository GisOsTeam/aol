import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class Like implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.like;

  constructor(not = false) {
    this.not = not;
  }

  public toString(): string {
    if (this.not) {
      return 'NOT LIKE';
    }
    return 'LIKE';
  }
}
