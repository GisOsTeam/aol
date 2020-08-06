import { IOperator, OperatorEnum, OperatorType } from './IOperator';

export class Or implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.or;

  constructor(not = false) {
    this.not = not;
  }

  public toString(): string {
    if (this.not) {
      return '|| !';
    }
    return '||';
  }
}
