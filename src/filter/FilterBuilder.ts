import { FilterBuilderType } from './IFilter';
import { And, BasePredicate, Or } from './predicate';
import { IOperator } from './operator';

export class FilterBuilder {
  public predicate: BasePredicate<any, any, any>;

  constructor(predicate: BasePredicate<any, any, any>) {
    this.predicate = predicate;
  }

  public static build(predicate: BasePredicate<any, IOperator, any>, type: FilterBuilderType): string {
    if (!predicate) {
      return 'INCLUDE';
    }
    return predicate.toString(type);
  }

  public build(type: FilterBuilderType): string {
    if (!this.predicate) {
      return 'INCLUDE';
    }
    return this.predicate.toString(type);
  }

  public and<RP extends BasePredicate<any, IOperator, any>>(rightPredicate: RP): FilterBuilder {
    return new FilterBuilder(new And(this.predicate, rightPredicate));
  }

  public or<RP extends BasePredicate<any, IOperator, any>>(rightPredicate: RP): FilterBuilder {
    return new FilterBuilder(new Or<any, RP>(this.predicate, rightPredicate));
  }
}
