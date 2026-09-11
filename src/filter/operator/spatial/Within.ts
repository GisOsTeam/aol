import { IOperator } from '../IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../../IFilter';

export class Within implements IOperator {
  public not: boolean;
  public readonly type = 'Within';

  public constructor(not = false) {
    this.not = not;
  }
  public toString(filterBuilderType?: FilterBuilderType): string {
    if (this.not) {
      throw new Error(`Operator 'not' is not implemented`);
    }
    switch (filterBuilderType) {
      case FilterBuilderTypeEnum.CQL:
        return 'WITHIN';
      case FilterBuilderTypeEnum.OGC:
        return 'fes:Within';
      default:
        throw new Error('filters other than CQL and OGC are not implemented');
    }
  }
}
