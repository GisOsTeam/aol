import { IOperator } from '../IOperator';
import { FilterBuilderType, FilterBuilderTypeEnum } from '../../IFilter';
import { getFesOperatorTag } from '../../fes';

/**
 * Shared implementation for the spatial operators (BBOX, Contains, Disjoint, Intersects,
 * Within): they only differ by their `type` (used to look up their FES 2.0 tag, see fes.ts)
 * and their CQL function name. `not` is not implemented for any of them yet in either format.
 */
export abstract class SpatialOperatorBase implements IOperator {
  public not: boolean;
  public readonly type: string;
  private readonly cqlName: string;

  protected constructor(type: string, cqlName: string, not = false) {
    this.type = type;
    this.cqlName = cqlName;
    this.not = not;
  }

  public toString(filterBuilderType?: FilterBuilderType): string {
    if (this.not) {
      throw new Error(`Operator 'not' is not implemented`);
    }
    switch (filterBuilderType) {
      case FilterBuilderTypeEnum.CQL:
        return this.cqlName;
      case FilterBuilderTypeEnum.OGC:
        return getFesOperatorTag(this.type);
      default:
        throw new Error('filters other than CQL and OGC are not implemented');
    }
  }
}
