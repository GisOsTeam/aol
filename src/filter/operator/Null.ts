import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class Null implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.null;

  constructor(not = false) {
    this.not = not;
  }

  public toString(): string {
    if (this.not) {
      return 'IS NOT NULL';
    }
    return 'IS NULL';
  }
}
