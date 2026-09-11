import { OperatorEnum } from '../IOperator';
import { SpatialOperatorBase } from './SpatialOperatorBase';

export class Disjoint extends SpatialOperatorBase {
  public constructor(not = false) {
    super(OperatorEnum.Disjoint, 'DISJOINT', not);
  }
}
