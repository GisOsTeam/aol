import { FilterBuilderType } from './IFilter';
import { Predicate } from './Predicate';

export class FilterBuilder {
  public static build(predicates: Predicate<null>[], type: FilterBuilderType): string {
    const predicatesAsString: string[] = [];
    if (predicates != null) {
      predicates.forEach((filter: Predicate<null>) => {
        predicatesAsString.push(filter.toString(type));
      });
    }
    if (predicatesAsString.length === 0) {
      return 'INCLUDE';
    }
    return predicatesAsString.join(' && ');
  }
}
