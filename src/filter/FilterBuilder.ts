import { FilterBuilderType } from './IFilter';
import { AndPre, IPredicate, Or } from './predicate';

export class FilterBuilder {
  public predicate: IPredicate;

  constructor(predicate: IPredicate) {
    this.predicate = predicate;
  }

  public static build(predicate: IPredicate, type: FilterBuilderType): string {
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

  public and<RP extends IPredicate>(rightPredicate: RP): FilterBuilder {
    return new FilterBuilder(new AndPre(this.predicate, rightPredicate));
  }

  public or<RP extends IPredicate>(rightPredicate: RP): FilterBuilder {
    return new FilterBuilder(new Or<any, RP>(this.predicate, rightPredicate));
  }
}
