import { OperatorEnum } from '../IOperator';
import { SpatialOperatorBase } from './SpatialOperatorBase';

export class Intersects extends SpatialOperatorBase {
  public constructor(not = false) {
    super(OperatorEnum.Intersects, 'INTERSECTS', not);
  }
}
