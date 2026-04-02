import { IOperator } from '../IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../../IFilter';

export class BoundingBox implements IOperator {
  public not: boolean;
  public readonly type = 'BoundingBox';

  public constructor(not = false) {
    this.not = not;
  }
  public toString(filterBuilderType?: FilterBuilderType): string {
    if (filterBuilderType === FilterBuilderTypeEnum.CQL) {
      if (this.not) {
        throw new Error(`Operator 'not' is not implemented`);
      }
      return 'BBOX';
    }

    throw new Error('filters other than CQL are not implemented');
  }
}
