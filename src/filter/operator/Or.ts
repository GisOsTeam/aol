import { IOperator, OperatorEnum, OperatorType } from './IOperator';
import { FilterBuilderTypeEnum } from '../IFilter';
import { getFesOperatorTag } from '../fes';

export class Or implements IOperator {
  public not: boolean;
  public readonly type: OperatorType = OperatorEnum.or;

  constructor(not = false) {
    this.not = not;
  }

  public toString(type?: FilterBuilderTypeEnum): string {
    switch (type) {
      case FilterBuilderTypeEnum.OGC:
        return getFesOperatorTag(this.type);
      default:
        if (this.not) {
          return 'OR NOT';
        }
        return 'OR';
    }
  }
}
