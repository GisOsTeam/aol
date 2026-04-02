import { FilterBuilderType, FilterValueType, IField } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from '../operator';
import { BoundingBox } from '../operator/spatial';
import { Contains } from '../operator/spatial/Contains';
import { Disjoint } from '../operator/spatial/Disjoint';
import { Intersects } from '../operator/spatial/Intersects';
import { Within } from '../operator/spatial/Within';
import { FilterPredicate } from './FilterPredicate';
import { IPredicate } from './IPredicate';

export class SpatialPre extends FilterPredicate<string> {
  public constructor(leftHand: IField<string>, rightHand: FilterValueType, operator?: IOperator) {
    super(leftHand, operator, rightHand);
  }

  public static buildFromPredicate(predicate: IPredicate): SpatialPre {
    return new SpatialPre(predicate.leftHand, predicate.rightHand, this.buildOperator(predicate.operator.type));
  }

  public static buildOperator(operatorType: OperatorType): IOperator {
    switch (operatorType) {
      case OperatorEnum.BBOX:
        // Formule du CQL_filter : BBOX(Geometry_column, minx, miny, maxx, maxy, 'CRS')
        return new BoundingBox();

      case OperatorEnum.Intersects:
        // Formule du CQL_filter : intersects(Geometry_column, Geometry)
        return new Intersects();

      case OperatorEnum.Contains:
        // Formule du CQL_filter : contains(Geometry_column, Geometry)
        return new Contains();

      case OperatorEnum.Disjoint:
        // Formule du CQL_filter : disjoint(Geometry_column, Geometry)
        return new Disjoint();

      case OperatorEnum.Within:
        // Formule du CQL_filter : within(Geometry_column, Geometry)
        return new Within();
    }
  }

  public toString(type?: FilterBuilderType): string {
    return `(${this.operator.toString(type)}(${this.buildLeftHandString()},${this.buildRightHandString()}))`;
  }
  protected buildLeftHandString(): string {
    return `${String(this.leftHand.key)}`;
  }

  protected buildRightHandString(): string {
    return `${this.rightHand}`;
  }
}
