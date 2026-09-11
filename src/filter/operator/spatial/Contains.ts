import { IOperator } from '../IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../../IFilter';

export class Contains implements IOperator {
  public not: boolean;
  public readonly type = 'Contains';

  public constructor(not = false) {
    this.not = not;
  }
  public toString(filterBuilderType?: FilterBuilderType): string {
    if (this.not) {
      throw new Error(`Operator 'not' is not implemented`);
    }
    switch (filterBuilderType) {
      case FilterBuilderTypeEnum.CQL:
        return 'CONTAINS';
      case FilterBuilderTypeEnum.OGC:
        return 'fes:Contains';
      default:
        throw new Error('filters other than CQL and OGC are not implemented');
    }
  }
}
