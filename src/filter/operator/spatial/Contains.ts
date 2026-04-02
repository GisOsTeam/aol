import { IOperator } from '../IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../../IFilter';

export class Contains implements IOperator {
  public not: boolean;
  public readonly type = 'Contains';

  public constructor(not = false) {
    this.not = not;
  }
  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.CQL) {
      if (this.not) {
        throw new Error(`Operator 'not' is not implemented`);
      }
      return 'CONTAINS';
    }

    throw new Error('filters other than CQL are not implemented');
  }
}
