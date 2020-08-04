import { Equal, Ilike, In, Like } from '../../filter/operator';
import { FieldTypeEnum, FilterBuilder, FilterBuilderTypeEnum, IFilter } from '../../filter';
import { Predicate } from '../../filter/Predicate';

describe('aol.filter', () => {
  describe('operator', () => {
    test('Equal', () => {
      let inOperator = new Equal();
      expect<string>(inOperator.toString()).toEqual('=');
      inOperator = new Equal(true);
      expect<string>(inOperator.toString()).toEqual('<>');
    });
    test('Ilike', () => {
      let inOperator = new Ilike();
      expect<string>(inOperator.toString(FilterBuilderTypeEnum.SQL)).toEqual('LIKE');
      expect<string>(inOperator.toString()).toEqual('ILIKE');
      inOperator = new Ilike(true);
      expect<string>(inOperator.toString(FilterBuilderTypeEnum.SQL)).toEqual('NOT LIKE');
      expect<string>(inOperator.toString()).toEqual('NOT ILIKE');
    });
    test('In', () => {
      let inOperator = new In();
      expect<string>(inOperator.toString()).toEqual('IN');
      inOperator = new In(true);
      expect<string>(inOperator.toString()).toEqual('NOT IN');
    });
    test('Like', () => {
      let inOperator = new Like();
      expect<string>(inOperator.toString()).toEqual('LIKE');
      inOperator = new Like(true);
      expect<string>(inOperator.toString()).toEqual('NOT LIKE');
    });
  });

  describe('filterBuilder', () => {
    describe('empty', () => {
      test('', () => {
        expect(FilterBuilder.build([], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
      });
    });

    describe('multiple', () => {
      describe('cql', () => {
        describe('equal', () => {
          test('number AND string', () => {
            const filter1: IFilter<{ foo: number }> = {
              field: {
                type: FieldTypeEnum.Number,
                key: 'foo',
              },
              operator: new Equal(),
              value: 1,
            };
            const filter2: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'bar',
              },
              operator: new Equal(),
              value: 'bar',
            };
            expect(
              FilterBuilder.build([new Predicate(filter1), new Predicate(filter2)], FilterBuilderTypeEnum.CQL)
            ).toMatchSnapshot();
          });
        });
      });
    });

    describe('simple', () => {
      describe('cql', () => {
        describe('equal', () => {
          test('number', () => {
            const filter: IFilter<{ foo: number }> = {
              field: {
                type: FieldTypeEnum.Number,
                key: 'foo',
              },
              operator: new Equal(),
              value: 1,
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });

          test('not.number', () => {
            const filter: IFilter<{ foo: number }> = {
              field: {
                type: FieldTypeEnum.Number,
                key: 'foo',
              },
              operator: new Equal(true),
              value: 1,
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });

          test('string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Equal(),
              value: '1',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });

          test('not.string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Equal(true),
              value: '1',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });

          test('boolean', () => {
            const filter: IFilter<{ foo: boolean }> = {
              field: {
                type: FieldTypeEnum.Boolean,
                key: 'foo',
              },
              operator: new Equal(),
              value: true,
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });

          test('not.boolean', () => {
            const filter: IFilter<{ foo: boolean }> = {
              field: {
                type: FieldTypeEnum.Boolean,
                key: 'foo',
              },
              operator: new Equal(true),
              value: true,
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });
        });
        describe('ilike', () => {
          test('string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Ilike(),
              value: '%bar%',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });

          test('not.string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Ilike(true),
              value: '%bar%',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });
        });
        describe('in', () => {
          test('not.number', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new In(true),
              value: [1, 2, 3],
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });
          test('number', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new In(),
              value: [1, 2, 3],
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });

          test('not.string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new In(true),
              value: ['bar1', 'bar2', 'bar3'],
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });
          test('string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new In(),
              value: ['bar1', 'bar2', 'bar3'],
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });
        });
        describe('like', () => {
          test('string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Like(),
              value: '%bar%',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });

          test('not.string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Like(true),
              value: '%bar%',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });
        });
      });

      describe('sql', () => {
        describe('equal', () => {
          test('number', () => {
            const filter: IFilter<{ foo: number }> = {
              field: {
                type: FieldTypeEnum.Number,
                key: 'foo',
              },
              operator: new Equal(),
              value: 1,
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });

          test('not.number', () => {
            const filter: IFilter<{ foo: number }> = {
              field: {
                type: FieldTypeEnum.Number,
                key: 'foo',
              },
              operator: new Equal(true),
              value: 1,
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });

          test('string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Equal(),
              value: '1',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });

          test('not.string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Equal(true),
              value: '1',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });

          test('boolean', () => {
            const filter: IFilter<{ foo: boolean }> = {
              field: {
                type: FieldTypeEnum.Boolean,
                key: 'foo',
              },
              operator: new Equal(),
              value: true,
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });

          test('not.boolean', () => {
            const filter: IFilter<{ foo: boolean }> = {
              field: {
                type: FieldTypeEnum.Boolean,
                key: 'foo',
              },
              operator: new Equal(true),
              value: true,
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });
        });
        describe('ilike', () => {
          test('string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Ilike(),
              value: '%bar%',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });

          test('not.string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Ilike(true),
              value: '%bar%',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });
        });
        describe('in', () => {
          test('not.number', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new In(true),
              value: [1, 2, 3],
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });
          test('number', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new In(),
              value: [1, 2, 3],
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });

          test('not.string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new In(true),
              value: ['bar1', 'bar2', 'bar3'],
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });
          test('string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new In(),
              value: ['bar1', 'bar2', 'bar3'],
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });
        });
        describe('like', () => {
          test('string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Like(),
              value: '%bar%',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });

          test('not.string', () => {
            const filter: IFilter<{ foo: string }> = {
              field: {
                type: FieldTypeEnum.String,
                key: 'foo',
              },
              operator: new Like(true),
              value: '%bar%',
            };
            expect(FilterBuilder.build([new Predicate(filter)], FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
          });
        });
      });
    });
  });
});
