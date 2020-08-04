import { Equal, Ilike, In, Like } from '../../filter/operator';
import { FilterBuilderTypeEnum } from '../../filter';

describe('aol.filterBuilder', () => {
  test('operator.Equal', () => {
    let inOperator = new Equal();
    expect<string>(inOperator.toString()).toEqual('=');
    inOperator = new Equal(true);
    expect<string>(inOperator.toString()).toEqual('<>');
  });
  test('operator.Ilike', () => {
    let inOperator = new Ilike();
    expect<string>(inOperator.toString(FilterBuilderTypeEnum.SQL)).toEqual('LIKE');
    expect<string>(inOperator.toString()).toEqual('ILIKE');
    inOperator = new Ilike(true);
    expect<string>(inOperator.toString(FilterBuilderTypeEnum.SQL)).toEqual('NOT LIKE');
    expect<string>(inOperator.toString()).toEqual('NOT ILIKE');
  });
  test('operator.In', () => {
    let inOperator = new In();
    expect<string>(inOperator.toString()).toEqual('IN');
    inOperator = new In(true);
    expect<string>(inOperator.toString()).toEqual('NOT IN');
  });
  test('operator.Like', () => {
    let inOperator = new Like();
    expect<string>(inOperator.toString()).toEqual('LIKE');
    inOperator = new Like(true);
    expect<string>(inOperator.toString()).toEqual('NOT LIKE');
  });
});
