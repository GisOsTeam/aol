import {
  AndOp,
  Equal as EqualOp,
  Ilike as IlikeOp,
  In as InOp,
  Like as LikeOp,
  Or as OrOp,
} from '../../filter/operator';
import { FieldTypeEnum, FilterBuilder, FilterBuilderTypeEnum, IField } from '../../filter';
import { AndPre, Equal, Ilike, In, Like, Or } from '../../filter/predicate';

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
      expect<string>(operator.toString()).toEqual('&&');
      operator = new AndOp(true);
      expect<string>(operator.toString()).toEqual('&& !');
    });
    test('Equal', () => {
      let operator = new EqualOp();
      expect<string>(operator.toString()).toEqual('=');
      operator = new EqualOp(true);
      expect<string>(operator.toString()).toEqual('<>');
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
    test('Or', () => {
      let operator = new OrOp();
      expect<string>(operator.toString()).toEqual('||');
      operator = new OrOp(true);
      expect<string>(operator.toString()).toEqual('|| !');
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
    });
  });
});