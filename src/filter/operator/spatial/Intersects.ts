import { IOperator } from '../IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../../IFilter';

export class Intersects implements IOperator {
  public not: boolean;
  public readonly type = 'Intersects';

  public constructor(not = false) {
    this.not = not;
  }
  public toString(filterBuilderType?: FilterBuilderType): string {
    if (this.not) {
      throw new Error(`Operator 'not' is not implemented`);
    }
    switch (filterBuilderType) {
      case FilterBuilderTypeEnum.CQL:
        return 'INTERSECTS';
      case FilterBuilderTypeEnum.OGC:
        return 'fes:Intersects';
      default:
        throw new Error('filters other than CQL and OGC are not implemented');
    }
  }
}
