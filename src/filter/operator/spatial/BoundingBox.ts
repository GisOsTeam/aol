import { OperatorEnum } from '../IOperator';
import { SpatialOperatorBase } from './SpatialOperatorBase';

export class BoundingBox extends SpatialOperatorBase {
  public constructor(not = false) {
    super(OperatorEnum.BBOX, 'BBOX', not);
  }
}
