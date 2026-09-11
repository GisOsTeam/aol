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
import { BoundingBox, Contains, Disjoint, Intersects, Within } from '../../filter/operator/spatial';
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
  SpatialPre,
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
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:And');
    });
    test('Equal', () => {
      let operator = new EqualOp();
      expect<string>(operator.toString()).toEqual('=');
      operator = new EqualOp(true);
      expect<string>(operator.toString()).toEqual('<>');
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:PropertyIsEqualTo');
    });
    test('GreaterThan', () => {
      const operator = new GreaterThanOp();
      expect<string>(operator.toString()).toEqual('>');
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:PropertyIsGreaterThan');
    });
    test('GreaterOrEqualThan', () => {
      const operator = new GreaterOrEqualThanOp();
      expect<string>(operator.toString()).toEqual('>=');
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:PropertyIsGreaterThanOrEqualTo');
    });
    test('Ilike', () => {
      let operator = new IlikeOp();
      expect<string>(operator.toString(FilterBuilderTypeEnum.SQL)).toEqual('LIKE');
      expect<string>(operator.toString()).toEqual('ILIKE');
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:PropertyIsLike');
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
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:PropertyIsLike');
      operator = new LikeOp(true);
      expect<string>(operator.toString()).toEqual('NOT LIKE');
    });
    test('LowerThan', () => {
      const operator = new LowerThanOp();
      expect<string>(operator.toString()).toEqual('<');
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:PropertyIsLessThan');
    });
    test('LowerOrEqualThan', () => {
      const operator = new LowerOrEqualThanOp();
      expect<string>(operator.toString()).toEqual('<=');
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:PropertyIsLessThanOrEqualTo');
    });
    test('Null', () => {
      let operator = new NullOp();
      expect<string>(operator.toString()).toEqual('IS NULL');
      operator = new NullOp(true);
      expect<string>(operator.toString()).toEqual('IS NOT NULL');
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:PropertyIsNull');
    });
    test('Or', () => {
      let operator = new OrOp();
      expect<string>(operator.toString()).toEqual('OR');
      operator = new OrOp(true);
      expect<string>(operator.toString()).toEqual('OR NOT');
      expect<string>(operator.toString(FilterBuilderTypeEnum.OGC)).toEqual('fes:Or');
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
      describe('ogc', () => {
        test('number', () => {
          const predicate = new Equal(numberField, new EqualOp(), 1);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>',
          );
        });

        test('string', () => {
          const predicate = new Equal(stringField, new EqualOp(), 'bar');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>bar</fes:Literal></fes:PropertyIsEqualTo>',
          );
        });

        test('not.number', () => {
          const predicate = new Equal(numberField, new EqualOp(true), 1);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Not><fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo></fes:Not>',
          );
        });

        test('not.string', () => {
          const predicate = new Equal(stringField, new EqualOp(true), 'bar');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Not><fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>bar</fes:Literal></fes:PropertyIsEqualTo></fes:Not>',
          );
        });

        test('boolean', () => {
          const predicate = new Equal(booleanField, new EqualOp(), true);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>true</fes:Literal></fes:PropertyIsEqualTo>',
          );
        });

        test('not.boolean', () => {
          const predicate = new Equal(booleanField, new EqualOp(true), true);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Not><fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>true</fes:Literal></fes:PropertyIsEqualTo></fes:Not>',
          );
        });

        test('escapes XML special characters in the literal value', () => {
          const predicate = new Equal(stringField, new EqualOp(), '<a> & "b"');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>&lt;a&gt; &amp; "b"</fes:Literal></fes:PropertyIsEqualTo>',
          );
        });
      });
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
      describe('ogc', () => {
        test('number', () => {
          const predicate = new GreaterOrEqualThan(numberField, 1);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsGreaterThanOrEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsGreaterThanOrEqualTo>',
          );
        });

        test('string', () => {
          const predicate = new GreaterOrEqualThan(stringField, '2020-01-01');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsGreaterThanOrEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>2020-01-01</fes:Literal></fes:PropertyIsGreaterThanOrEqualTo>',
          );
        });
      });
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
      describe('ogc', () => {
        test('number', () => {
          const predicate = new GreaterThan(numberField, 1);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsGreaterThan><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsGreaterThan>',
          );
        });

        test('string', () => {
          const predicate = new GreaterThan(stringField, '2020-01-01');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsGreaterThan><fes:ValueReference>foo</fes:ValueReference><fes:Literal>2020-01-01</fes:Literal></fes:PropertyIsGreaterThan>',
          );
        });
      });
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
      describe('ogc', () => {
        test('string', () => {
          const predicate = new Ilike(stringField, new IlikeOp(), '%bar%');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\\" matchCase="false">' +
              '<fes:ValueReference>foo</fes:ValueReference><fes:Literal>%bar%</fes:Literal></fes:PropertyIsLike>',
          );
        });

        test('not.string', () => {
          const predicate = new Ilike(stringField, new IlikeOp(true), '%bar%');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Not><fes:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\\" matchCase="false">' +
              '<fes:ValueReference>foo</fes:ValueReference><fes:Literal>%bar%</fes:Literal></fes:PropertyIsLike></fes:Not>',
          );
        });
      });
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
      describe('ogc', () => {
        test('number', () => {
          const predicate = new In(numberField, new InOp(), [1, 2, 3]);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Or>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>2</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>3</fes:Literal></fes:PropertyIsEqualTo>' +
              '</fes:Or>',
          );
        });

        test('not.number', () => {
          const predicate = new In(numberField, new InOp(true), [1, 2]);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Not><fes:Or>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>2</fes:Literal></fes:PropertyIsEqualTo>' +
              '</fes:Or></fes:Not>',
          );
        });

        test('single value (no fes:Or wrapper)', () => {
          const predicate = new In(numberField, new InOp(), [1]);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>',
          );
        });

        test('string', () => {
          const predicate = new In(stringField, new InOp(), ['bar1', 'bar2']);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Or>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>bar1</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>bar2</fes:Literal></fes:PropertyIsEqualTo>' +
              '</fes:Or>',
          );
        });

        test('raw comma-separated id list (not an array)', () => {
          // Some callers pass a pre-joined id list (see the SQL "multiple complex" test below)
          // instead of an array; FES has no "IN (...)" syntax so it must still be split and
          // rendered as one PropertyIsEqualTo per id.
          const predicate = new In(numberField, new InOp(), '1,2,3');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Or>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>2</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>3</fes:Literal></fes:PropertyIsEqualTo>' +
              '</fes:Or>',
          );
        });
      });
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
      describe('ogc', () => {
        test('string', () => {
          const predicate = new Like(stringField, new LikeOp(), '%bar%');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\\" matchCase="true">' +
              '<fes:ValueReference>foo</fes:ValueReference><fes:Literal>%bar%</fes:Literal></fes:PropertyIsLike>',
          );
        });

        test('not.string', () => {
          const predicate = new Like(stringField, new LikeOp(true), '%bar%');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Not><fes:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\\" matchCase="true">' +
              '<fes:ValueReference>foo</fes:ValueReference><fes:Literal>%bar%</fes:Literal></fes:PropertyIsLike></fes:Not>',
          );
        });
      });
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
      describe('ogc', () => {
        test('number', () => {
          const predicate = new LowerOrEqualThan(numberField, 1);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsLessThanOrEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsLessThanOrEqualTo>',
          );
        });

        test('string', () => {
          const predicate = new LowerOrEqualThan(stringField, '2020-01-01');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsLessThanOrEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>2020-01-01</fes:Literal></fes:PropertyIsLessThanOrEqualTo>',
          );
        });
      });
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
      describe('ogc', () => {
        test('number', () => {
          const predicate = new LowerThan(numberField, 1);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsLessThan><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsLessThan>',
          );
        });

        test('string', () => {
          const predicate = new LowerThan(stringField, '2020-01-01');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsLessThan><fes:ValueReference>foo</fes:ValueReference><fes:Literal>2020-01-01</fes:Literal></fes:PropertyIsLessThan>',
          );
        });
      });
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
      describe('ogc', () => {
        test('', () => {
          const predicate = new Null(stringField, new NullOp());
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:PropertyIsNull><fes:ValueReference>foo</fes:ValueReference></fes:PropertyIsNull>',
          );
        });

        test('not', () => {
          const predicate = new Null(stringField, new NullOp(true));
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Not><fes:PropertyIsNull><fes:ValueReference>foo</fes:ValueReference></fes:PropertyIsNull></fes:Not>',
          );
        });
      });
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

    describe('and', () => {
      describe('ogc', () => {
        test('', () => {
          const predicate1 = new Equal(numberField, new EqualOp(), 1);
          const predicate2 = new Equal(stringField, new EqualOp(), 'bar');
          const predicate = new AndPre(predicate1, predicate2);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:And>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>bar</fes:Literal></fes:PropertyIsEqualTo>' +
              '</fes:And>',
          );
        });

        test('nested: And of different predicate kinds (GreaterThan, Null)', () => {
          const predicate1 = new GreaterThan(numberField, 1);
          const predicate2 = new Null(stringField, new NullOp());
          const predicate = new AndPre(predicate1, predicate2);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:And>' +
              '<fes:PropertyIsGreaterThan><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsGreaterThan>' +
              '<fes:PropertyIsNull><fes:ValueReference>foo</fes:ValueReference></fes:PropertyIsNull>' +
              '</fes:And>',
          );
        });

        test('nested: And containing an Or', () => {
          const predicate1 = new Equal(numberField, new EqualOp(), 1);
          const predicate2 = new Equal(numberField, new EqualOp(), 2);
          const orPredicate = new Or(predicate1, predicate2);
          const predicate3 = new Null(stringField, new NullOp());
          const predicate = new AndPre(orPredicate, predicate3);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:And>' +
              '<fes:Or>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>2</fes:Literal></fes:PropertyIsEqualTo>' +
              '</fes:Or>' +
              '<fes:PropertyIsNull><fes:ValueReference>foo</fes:ValueReference></fes:PropertyIsNull>' +
              '</fes:And>',
          );
        });
      });
      describe('cql', () => {
        // TODO
      });
      describe('sql', () => {
        // TODO
      });
    });

    describe('or', () => {
      describe('ogc', () => {
        test('', () => {
          const predicate1 = new Equal(numberField, new EqualOp(), 1);
          const predicate2 = new Equal(stringField, new EqualOp(), 'bar');
          const predicate = new Or(predicate1, predicate2);
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Or>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>bar</fes:Literal></fes:PropertyIsEqualTo>' +
              '</fes:Or>',
          );
        });
      });
      describe('cql', () => {
        // TODO
      });
      describe('sql', () => {
        // TODO
      });
    });

    describe('spatial', () => {
      const geometryField: IField<string> = {
        type: FieldTypeEnum.Geometry,
        key: 'the_geom',
      };

      describe('ogc', () => {
        test('intersects (WKT point)', () => {
          const predicate = new SpatialPre(geometryField, 'POINT(1 2)', new Intersects());
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Intersects><fes:ValueReference>the_geom</fes:ValueReference>' +
              '<Point xmlns="http://www.opengis.net/gml/3.2"><pos srsDimension="2">1 2</pos></Point>' +
              '</fes:Intersects>',
          );
        });

        test('contains (WKT polygon)', () => {
          const predicate = new SpatialPre(geometryField, 'POLYGON((0 0,0 1,1 1,1 0,0 0))', new Contains());
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Contains><fes:ValueReference>the_geom</fes:ValueReference>' +
              '<Polygon xmlns="http://www.opengis.net/gml/3.2">' +
              '<exterior><LinearRing><posList srsDimension="2">0 0 0 1 1 1 1 0 0 0</posList></LinearRing></exterior>' +
              '</Polygon></fes:Contains>',
          );
        });

        test('contains (WKT polygon with a hole)', () => {
          const predicate = new SpatialPre(
            geometryField,
            'POLYGON((0 0,0 4,4 4,4 0,0 0),(1 1,1 2,2 2,2 1,1 1))',
            new Contains(),
          );
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Contains><fes:ValueReference>the_geom</fes:ValueReference>' +
              '<Polygon xmlns="http://www.opengis.net/gml/3.2">' +
              '<exterior><LinearRing><posList srsDimension="2">0 0 0 4 4 4 4 0 0 0</posList></LinearRing></exterior>' +
              '<interior><LinearRing><posList srsDimension="2">1 1 1 2 2 2 2 1 1 1</posList></LinearRing></interior>' +
              '</Polygon></fes:Contains>',
          );
        });

        test('intersects (WKT line string)', () => {
          const predicate = new SpatialPre(geometryField, 'LINESTRING(0 0, 1 1, 2 0)', new Intersects());
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Intersects><fes:ValueReference>the_geom</fes:ValueReference>' +
              '<LineString xmlns="http://www.opengis.net/gml/3.2"><posList srsDimension="2">0 0 1 1 2 0</posList></LineString>' +
              '</fes:Intersects>',
          );
        });

        test('intersects (WKT point) with an explicit srsName, coordinates kept as-authored (no axis swap)', () => {
          const predicate = new SpatialPre(geometryField, 'POINT(1 2)', new Intersects(), 'EPSG:4326');
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Intersects><fes:ValueReference>the_geom</fes:ValueReference>' +
              '<Point xmlns="http://www.opengis.net/gml/3.2" srsName="EPSG:4326"><pos srsDimension="2">1 2</pos></Point>' +
              '</fes:Intersects>',
          );
        });

        test('disjoint (WKT point)', () => {
          const predicate = new SpatialPre(geometryField, 'POINT(1 2)', new Disjoint());
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Disjoint><fes:ValueReference>the_geom</fes:ValueReference>' +
              '<Point xmlns="http://www.opengis.net/gml/3.2"><pos srsDimension="2">1 2</pos></Point>' +
              '</fes:Disjoint>',
          );
        });

        test('within (WKT point)', () => {
          const predicate = new SpatialPre(geometryField, 'POINT(1 2)', new Within());
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:Within><fes:ValueReference>the_geom</fes:ValueReference>' +
              '<Point xmlns="http://www.opengis.net/gml/3.2"><pos srsDimension="2">1 2</pos></Point>' +
              '</fes:Within>',
          );
        });

        test('bbox', () => {
          const predicate = new SpatialPre(geometryField, "1,2,3,4,'EPSG:4326'", new BoundingBox());
          expect(predicate.toString(FilterBuilderTypeEnum.OGC)).toEqual(
            '<fes:BBOX><fes:ValueReference>the_geom</fes:ValueReference>' +
              '<Envelope xmlns="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">' +
              '<lowerCorner>1 2</lowerCorner><upperCorner>3 4</upperCorner>' +
              '</Envelope></fes:BBOX>',
          );
        });

        test('throws on an unsupported BBOX value', () => {
          const predicate = new SpatialPre(geometryField, 'not-a-bbox', new BoundingBox());
          expect(() => predicate.toString(FilterBuilderTypeEnum.OGC)).toThrow();
        });

        test('throws on a non-WKT geometry value', () => {
          const predicate = new SpatialPre(geometryField, 'not-a-wkt-geometry', new Intersects());
          expect(() => predicate.toString(FilterBuilderTypeEnum.OGC)).toThrow();
        });

        test('throws on a negated spatial operator (not implemented)', () => {
          const predicate = new SpatialPre(geometryField, 'POINT(1 2)', new Intersects(true));
          expect(() => predicate.toString(FilterBuilderTypeEnum.OGC)).toThrow();
        });
      });

      describe('cql', () => {
        test('bbox (unaffected by the OGC changes)', () => {
          const predicate = new SpatialPre(geometryField, "1,2,3,4,'EPSG:4326'", new BoundingBox());
          expect(predicate.toString(FilterBuilderTypeEnum.CQL)).toEqual("(BBOX(the_geom,1,2,3,4,'EPSG:4326'))");
        });
      });
    });
  });

  describe('filterBuilder', () => {
    describe('empty', () => {
      test('', () => {
        expect(FilterBuilder.build(null as never, FilterBuilderTypeEnum.CQL)).toMatchSnapshot();
      });
    });

    describe('multiple', () => {
      describe('ogc', () => {
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

            expect(FilterBuilder.build(predicate3, FilterBuilderTypeEnum.OGC)).toEqual(
              '<fes:And>' +
                '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
                '<fes:PropertyIsEqualTo><fes:ValueReference>bar</fes:ValueReference><fes:Literal>bar</fes:Literal></fes:PropertyIsEqualTo>' +
                '</fes:And>',
            );
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
              new FilterBuilder(predicate1).and(predicate2).or(predicate3).build(FilterBuilderTypeEnum.OGC),
            ).toEqual(
              '<fes:Or>' +
                '<fes:And>' +
                '<fes:PropertyIsEqualTo><fes:ValueReference>foo</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
                '<fes:PropertyIsEqualTo><fes:ValueReference>bar</fes:ValueReference><fes:Literal>bar</fes:Literal></fes:PropertyIsEqualTo>' +
                '</fes:And>' +
                '<fes:PropertyIsEqualTo><fes:ValueReference>bar3</fes:ValueReference><fes:Literal>bar3</fes:Literal></fes:PropertyIsEqualTo>' +
                '</fes:Or>',
            );
          });
        });

        test('deeply nested: (null OR greaterThan) AND lowerOrEqualThan AND in', () => {
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
              .build(FilterBuilderTypeEnum.OGC),
          ).toEqual(
            '<fes:And>' +
              '<fes:And>' +
              '<fes:Or>' +
              '<fes:PropertyIsNull><fes:ValueReference>date_fin</fes:ValueReference></fes:PropertyIsNull>' +
              '<fes:PropertyIsGreaterThan><fes:ValueReference>date_fin</fes:ValueReference><fes:Literal>2020-01-12</fes:Literal></fes:PropertyIsGreaterThan>' +
              '</fes:Or>' +
              '<fes:PropertyIsLessThanOrEqualTo><fes:ValueReference>date_debut</fes:ValueReference><fes:Literal>2020-01-12</fes:Literal></fes:PropertyIsLessThanOrEqualTo>' +
              '</fes:And>' +
              '<fes:Or>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>id_dependance</fes:ValueReference><fes:Literal>1</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>id_dependance</fes:ValueReference><fes:Literal>2</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>id_dependance</fes:ValueReference><fes:Literal>3</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>id_dependance</fes:ValueReference><fes:Literal>4</fes:Literal></fes:PropertyIsEqualTo>' +
              '<fes:PropertyIsEqualTo><fes:ValueReference>id_dependance</fes:ValueReference><fes:Literal>5</fes:Literal></fes:PropertyIsEqualTo>' +
              '</fes:Or>' +
              '</fes:And>',
          );
        });
      });

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
              new FilterBuilder(predicate1).and(predicate2).or(predicate3).build(FilterBuilderTypeEnum.CQL),
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
              .build(FilterBuilderTypeEnum.SQL),
          ).toMatchSnapshot();
        });
      });
    });
  });
});
