import {
  buildFesLiteral,
  buildFesValueReference,
  escapeXmlAttribute,
  escapeXmlText,
  wrapFesNot,
} from '../../filter/fes';

describe('aol.filter.fes', () => {
  describe('escapeXmlText', () => {
    test('escapes &, < and >', () => {
      expect(escapeXmlText('a & b < c > d')).toEqual('a &amp; b &lt; c &gt; d');
    });

    test('leaves plain text untouched', () => {
      expect(escapeXmlText('bar')).toEqual('bar');
    });

    test('does not double-escape an already-escaped &amp;', () => {
      expect(escapeXmlText('a & b')).toEqual('a &amp; b');
    });
  });

  describe('escapeXmlAttribute', () => {
    test('escapes &, <, > and "', () => {
      expect(escapeXmlAttribute('a & "b" < c > d')).toEqual('a &amp; &quot;b&quot; &lt; c &gt; d');
    });
  });

  describe('buildFesValueReference', () => {
    test('wraps the property name', () => {
      expect(buildFesValueReference('foo')).toEqual('<fes:ValueReference>foo</fes:ValueReference>');
    });

    test('escapes special characters in the property name', () => {
      expect(buildFesValueReference('a&b')).toEqual('<fes:ValueReference>a&amp;b</fes:ValueReference>');
    });
  });

  describe('buildFesLiteral', () => {
    test('renders a string value', () => {
      expect(buildFesLiteral('bar')).toEqual('<fes:Literal>bar</fes:Literal>');
    });

    test('renders a number value', () => {
      expect(buildFesLiteral(1)).toEqual('<fes:Literal>1</fes:Literal>');
    });

    test('renders a boolean value', () => {
      expect(buildFesLiteral(true)).toEqual('<fes:Literal>true</fes:Literal>');
    });

    test('escapes special characters in a string value', () => {
      expect(buildFesLiteral('<b>a & b</b>')).toEqual('<fes:Literal>&lt;b&gt;a &amp; b&lt;/b&gt;</fes:Literal>');
    });
  });

  describe('wrapFesNot', () => {
    test('wraps the fragment when not is true', () => {
      expect(wrapFesNot('<fes:PropertyIsNull/>', true)).toEqual('<fes:Not><fes:PropertyIsNull/></fes:Not>');
    });

    test('returns the fragment unchanged when not is false', () => {
      expect(wrapFesNot('<fes:PropertyIsNull/>', false)).toEqual('<fes:PropertyIsNull/>');
    });
  });
});
