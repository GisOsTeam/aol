import { OperatorEnum } from '../IOperator';
import { SpatialOperatorBase } from './SpatialOperatorBase';

export class Contains extends SpatialOperatorBase {
  public constructor(not = false) {
    super(OperatorEnum.Contains, 'CONTAINS', not);
  }
}
