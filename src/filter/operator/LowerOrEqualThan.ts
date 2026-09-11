import { FilterBuilderType, FilterBuilderTypeEnum } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from './IOperator';
import { getFesOperatorTag } from '../fes';

export class LowerOrEqualThan implements IOperator {
  public readonly not: boolean;
  public readonly type: OperatorType = OperatorEnum.lowerOrEqualThan;

  constructor() {
    this.not = false;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.OGC) {
      return getFesOperatorTag(this.type);
    }
    return '<=';
  }
}
