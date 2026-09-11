import { OperatorEnum } from '../IOperator';
import { SpatialOperatorBase } from './SpatialOperatorBase';

export class Within extends SpatialOperatorBase {
  public constructor(not = false) {
    super(OperatorEnum.Within, 'WITHIN', not);
  }
}
