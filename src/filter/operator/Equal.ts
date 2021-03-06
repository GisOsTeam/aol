import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class Equal implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.equal;

  constructor(not = false) {
    this.not = not;
  }

  public toString(): string {
    if (this.not) {
      return '<>';
    } else {
      return '=';
    }
  }
}
