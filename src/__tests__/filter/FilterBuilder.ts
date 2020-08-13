import {
  AndOp,
  Equal as EqualOp,
  GreaterOrEqualThan as GreaterOrEqualThanOp,
  GreaterThan as GreaterThanOp,
  Ilike as IlikeOp,
  In as InOp,
  Like as LikeOp,
  LowerOrEqualThan as LowerOrEqualThanOp,
  LowerThan as LowerThanOp,
  Null as NullOp,
  Or as OrOp,
} from '../../filter/operator';
import { FieldTypeEnum, FilterBuilder, FilterBuilderTypeEnum, IField } from '../../filter';
import {
  AndPre,
  Equal,
  GreaterOrEqualThan,
  GreaterThan,
  Ilike,
  In,
  Like,
  LowerOrEqualThan,
  LowerThan,
  Or,
} from '../../filter/predicate';
import { Null } from '../../filter/predicate/Null';

const numberField: IField<{ foo: number }> = {
  type: FieldTypeEnum.Number,
  key: 'foo',
};
const stringField: IField<{ foo: string }> = {
  type: FieldTypeEnum.String,
  key: 'foo',
};
const booleanField: IField<{ foo: boolean }> = {
  type: FieldTypeEnum.Boolean,
  key: 'foo',
};

describe('aol.filter', () => {
  describe('operator', () => {
    test('And', () => {
      let operator = new AndOp();
      expect<string>(operator.toString()).toEqual('AND');
      operator = new AndOp(true);
      expect<string>(operator.toString()).toEqual('AND NOT');
    });
    test('Equal', () => {
      let operator = new EqualOp();
      expect<string>(operator.toString()).toEqual('=');
      operator = new EqualOp(true);
      expect<string>(operator.toString()).toEqual('<>');
    });
    test('GreaterThan', () => {
      const operator = new GreaterThanOp();
      expect<string>(operator.toString()).toEqual('>');
    });
    test('GreaterOrEqualThan', () => {
      const operator = new GreaterOrEqualThanOp();
      expect<string>(operator.toString()).toEqual('>=');
    });
    test('Ilike', () => {
      let operator = new IlikeOp();
      expect<string>(operator.toString(FilterBuilderTypeEnum.SQL)).toEqual('LIKE');
      expect<string>(operator.toString()).toEqual('ILIKE');
      operator = new IlikeOp(true);
      expect<string>(operator.toString(FilterBuilderTypeEnum.SQL)).toEqual('NOT LIKE');
      expect<string>(operator.toString()).toEqual('NOT ILIKE');
    });
    test('In', () => {
      let operator = new InOp();
      expect<string>(operator.toString()).toEqual('IN');
      operator = new InOp(true);
      expect<string>(operator.toString()).toEqual('NOT IN');
    });
    test('Like', () => {
      let operator = new LikeOp();
      expect<string>(operator.toString()).toEqual('LIKE');
      operator = new LikeOp(true);
      expect<string>(operator.toString()).toEqual('NOT LIKE');
    });
    test('LowerThan', () => {
      const operator = new LowerThanOp();
      expect<string>(operator.toString()).toEqual('<');
    });
    test('LowerOrEqualThan', () => {
      const operator = new LowerOrEqualThanOp();
      expect<string>(operator.toString()).toEqual('<=');
    });
    test('Null', () => {
      let operator = new NullOp();
      expect<string>(operator.toString()).toEqual('IS NULL');
      operator = new NullOp(true);
      expect<string>(operator.toString()).toEqual('IS NOT NULL');
    });
    test('Or', () => {
      let operator = new OrOp();
      expect<string>(operator.toString()).toEqual('OR');
      operator = new OrOp(true);
      expect<string>(operator.toString()).toEqual('OR NOT');
    });
  });

  describe('predicate', () => {
    describe('and', () => {
      describe('cql', () => {
        // TODO
      });
      describe('sql', () => {
        // TODO
      });
    });

    describe('equal', () => {
      describe('cql', () => {
        test('not.number', () => {
          const predicate = new Equal(numberField, new EqualOp(true), 1);
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });

        test('number', () => {
          const predicate = new Equal(numberField, new EqualOp(), 1);
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });

        test('not.string', () => {
          const predicate = new Equal(stringField, new EqualOp(true), '1');
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });

        test('string', () => {
          const predicate = new Equal(stringField, new EqualOp(), '1');
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });

        test('not.boolean', () => {
          const predicate = new Equal(booleanField, new EqualOp(true), true);
          expect(FilterBuilder.build(predicate, FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });

        test('boolean', () => {
          const predicate = new Equal(booleanField, new EqualOp(), true);
          expect(FilterBuilder.build(predicate, FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });
      });
      describe('sql', () => {
        test('not.number', () => {
          const predicate = new Equal(numberField, new EqualOp(true), 1);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('number', () => {
          const predicate = new Equal(numberField, new EqualOp(), 1);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('not.string', () => {
          const predicate = new Equal(stringField, new EqualOp(true), '1');
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('string', () => {
          const predicate = new Equal(stringField, new EqualOp(), '1');
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('not.boolean', () => {
          const predicate = new Equal(booleanField, new EqualOp(true), true);
          expect(FilterBuilder.build(predicate, FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('boolean', () => {
          const predicate = new Equal(booleanField, new EqualOp(), true);
          expect(FilterBuilder.build(predicate, FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('greaterOrEqualThan', () => {
      describe('sql', () => {
        test('number', () => {
          const predicate = new GreaterOrEqualThan(numberField, 1);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('string', () => {
          const predicate = new GreaterOrEqualThan(stringField, '1');
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('greaterThan', () => {
      describe('sql', () => {
        test('number', () => {
          const predicate = new GreaterThan(numberField, 1);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('string', () => {
          const predicate = new GreaterThan(stringField, '1');
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('ilike', () => {
      describe('cql', () => {
        test('not.string', () => {
          const predicate = new Ilike(stringField, new IlikeOp(true), '%bar%');
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });

        test('string', () => {
          const predicate = new Ilike(stringField, new IlikeOp(), '%bar%');
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });
      });
      describe('sql', () => {
        test('not.string', () => {
          const predicate = new Ilike(stringField, new IlikeOp(true), '%bar%');
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('string', () => {
          const predicate = new Ilike(stringField, new IlikeOp(), '%bar%');
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('in', () => {
      describe('cql', () => {
        test('not.number', () => {
          const predicate = new In(numberField, new InOp(true), [1, 2, 3]);
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });
        test('number', () => {
          const predicate = new In(numberField, new InOp(), [1, 2, 3]);
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });

        test('not.string', () => {
          const predicate = new In(stringField, new InOp(true), ['bar1', 'bar2', 'bar3']);
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });
        test('string', () => {
          const predicate = new In(stringField, new InOp(), ['bar1', 'bar2', 'bar3']);
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });
      });
      describe('sql', () => {
        test('not.number', () => {
          const predicate = new In(numberField, new InOp(true), [1, 2, 3]);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
        test('number', () => {
          const predicate = new In(numberField, new InOp(), [1, 2, 3]);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('not.string', () => {
          const predicate = new In(stringField, new InOp(true), ['bar1', 'bar2', 'bar3']);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
        test('string', () => {
          const predicate = new In(stringField, new InOp(), ['bar1', 'bar2', 'bar3']);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('like', () => {
      describe('cql', () => {
        test('not.string', () => {
          const predicate = new Like(stringField, new LikeOp(true), '%bar%');
          expect(FilterBuilder.build(predicate, FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });
        test('string', () => {
          const predicate = new Like(stringField, new LikeOp(), '%bar%');
          expect(FilterBuilder.build(predicate, FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
        });
      });
      describe('sql', () => {
        test('not.string', () => {
          const predicate = new Like(stringField, new LikeOp(true), '%bar%');
          expect(FilterBuilder.build(predicate, FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
        test('string', () => {
          const predicate = new Like(stringField, new LikeOp(), '%bar%');
          expect(FilterBuilder.build(predicate, FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('lowerOrEqualThan', () => {
      describe('sql', () => {
        test('number', () => {
          const predicate = new LowerOrEqualThan(numberField, 1);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('string', () => {
          const predicate = new LowerOrEqualThan(stringField, '1');
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('lowerThan', () => {
      describe('sql', () => {
        test('number', () => {
          const predicate = new LowerThan(numberField, 1);
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('string', () => {
          const predicate = new LowerThan(stringField, '1');
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('null', () => {
      describe('sql', () => {
        test('not', () => {
          const predicate = new Null(numberField, new NullOp(true));
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });

        test('', () => {
          const predicate = new Null(stringField, new NullOp());
          expect(predicate.toString(FilterBuilderTypeEnum.SQL)).toMatchSnapshot();
        });
      });
    });

    describe('or', () => {
      describe('cql', () => {
        // TODO
      });
      describe('sql', () => {
        // TODO
      });
    });
  });

  describe('filterBuilder', () => {
    describe('empty', () => {
      test('', () => {
        expect(FilterBuilder.build(undefined, FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
      });
    });

    describe('multiple', () => {
      describe('cql', () => {
        describe('equal', () => {
          test('number AND string', () => {
            const field1: IField<{ foo: number }> = {
              type: FieldTypeEnum.Number,
              key: 'foo',
            };
            const predicate1 = new Equal(field1, new EqualOp(), 1);
            const field2: IField<{ foo: string }> = {
              type: FieldTypeEnum.String,
              key: 'bar',
            };
            const predicate2 = new Equal(field2, new EqualOp(), 'bar');

            const predicate3 = new AndPre(predicate1, predicate2);

            expect(FilterBuilder.build(predicate3, FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
          });
          test('complex', () => {
            const field1: IField<{ foo: number }> = {
              type: FieldTypeEnum.Number,
              key: 'foo',
            };
            const predicate1 = new Equal(field1, new EqualOp(), 1);

            const field2: IField<{ foo: string }> = {
              type: FieldTypeEnum.String,
              key: 'bar',
            };
            const predicate2 = new Equal(field2, new EqualOp(), 'bar');

            const field3: IField<{ foo: string }> = {
              type: FieldTypeEnum.String,
              key: 'bar3',
            };
            const predicate3 = new Equal(field3, new EqualOp(), 'bar3');

            expect(
              new FilterBuilder(predicate1).and(predicate2).or(predicate3).build(FilterBuilderTypeEnum.CQL)
            ).toMatchSnapshot();
          });
        });
      });
      describe('sql', () => {
        test('complex', () => {
          const dateDebutField: IField<any> = {
            key: 'date_debut',
            type: FieldTypeEnum.String,
          };
          const dateFinField: IField<any> = {
            key: 'date_fin',
            type: FieldTypeEnum.String,
          };
          const predicate1 = new LowerOrEqualThan(dateDebutField, '2020-01-12');
          const predicate2 = new Null(dateFinField, new NullOp());
          const predicate3 = new GreaterThan(dateFinField, '2020-01-12');

          const ids = '1,2,3,4,5';
          const field: IField<any> = {
            key: 'id_dependance',
            type: FieldTypeEnum.String,
          };
          const predicate4 = new In(field, new InOp(), ids);

          expect(
            new FilterBuilder(predicate2)
              .or(predicate3)
              .and(predicate1)
              .and(predicate4)
              .build(FilterBuilderTypeEnum.SQL)
          ).toMatchSnapshot();
        });
      });
    });
  });
});
