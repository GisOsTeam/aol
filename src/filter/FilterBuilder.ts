import { FilterBuilderType } from './IFilter';
import { AndPre, IPredicate, Or } from './predicate';

export class FilterBuilder {
  public predicate?: IPredicate;

  constructor(predicate?: IPredicate) {
    if (predicate) {
      this.predicate = predicate;
    }
  }

  public static build(predicate: IPredicate, type: FilterBuilderType): string {
    if (!predicate) {
      return 'INCLUDE';
    }
    return predicate.toString(type);
  }

  public and<RP extends IPredicate>(rightPredicate: RP): FilterBuilder {
    if (!this.predicate) {
      this.predicate = rightPredicate;
      return this;
    }
    this.predicate = new AndPre(this.predicate, rightPredicate);
    return this;
  }

  public build(type: FilterBuilderType): string {
    if (!this.predicate) {
      return 'INCLUDE';
    }
    return this.predicate.toString(type);
  }

  public from(predicate: IPredicate): FilterBuilder {
    if (this.predicate) {
      return this.and(predicate);
    }

    this.predicate = predicate;

    return this;
  }

  public or<RP extends IPredicate>(rightPredicate: RP): FilterBuilder {
    if (!this.predicate) {
      this.predicate = rightPredicate;
      return this;
    }
    this.predicate = new Or<any, RP>(this.predicate, rightPredicate);
    return this;
  }
}
