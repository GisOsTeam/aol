import { IOperator } from '../IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../../IFilter';

export class Disjoint implements IOperator {
  public not: boolean;
  public readonly type = 'Disjoint';

  public constructor(not = false) {
    this.not = not;
  }
  public toString(filterBuilderType?: FilterBuilderType): string {
    if (this.not) {
      throw new Error(`Operator 'not' is not implemented`);
    }
    switch (filterBuilderType) {
      case FilterBuilderTypeEnum.CQL:
        return 'DISJOINT';
      case FilterBuilderTypeEnum.OGC:
        return 'fes:Disjoint';
      default:
        throw new Error('filters other than CQL and OGC are not implemented');
    }
  }
}
