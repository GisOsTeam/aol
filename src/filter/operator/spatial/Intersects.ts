import { IOperator } from '../IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../../IFilter';

export class Intersects implements IOperator {
  public not: boolean;
  public readonly type = 'Intersects';

  public constructor(not = false) {
    this.not = not;
  }
  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.CQL) {
      if (this.not) {
        throw new Error(`Operator 'not' is not implemented`);
      }
      return 'INTERSECTS';
    }

    throw new Error('filters other than CQL are not implemented');
  }
}
