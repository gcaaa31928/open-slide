import { describe, expect, it } from 'vitest';
import { codeColumns, matchCodeTokens, parseLineRanges, tokenizeCode } from './code-move';

describe('tokenizeCode', () => {
  it('places tokens by row and column and classifies them', () => {
    const tokens = tokenizeCode("const x = 'hi'; // note\n  return x");
    expect(tokens.map((t) => [t.text, t.kind, t.row, t.narrow])).toEqual([
      ['const', 'keyword', 0, 0],
      ['x', 'word', 0, 6],
      ['=', 'punct', 0, 8],
      ["'hi'", 'string', 0, 10],
      [';', 'punct', 0, 14],
      ['// note', 'comment', 0, 16],
      ['return', 'keyword', 1, 2],
      ['x', 'word', 1, 9],
    ]);
  });

  it('counts CJK characters as wide so they can be placed in em', () => {
    const [label, after] = tokenizeCode('標題 = 1').filter((t) => t.kind !== 'punct');
    expect(label).toMatchObject({ text: '標題', narrow: 0, wide: 0 });
    expect(after).toMatchObject({ text: '1', narrow: 3, wide: 2 });
    expect(codeColumns('ab\n標題標題')).toEqual([0, 4]);
  });

  it('keeps multi-character operators together', () => {
    expect(tokenizeCode('a => b ?? c').map((t) => t.text)).toEqual(['a', '=>', 'b', '??', 'c']);
  });
});

describe('matchCodeTokens', () => {
  const pairs = (a: string, b: string) =>
    matchCodeTokens(tokenizeCode(a), tokenizeCode(b)).map((p) => [
      p.from ? `${p.from.text}@${p.from.row}` : null,
      p.to ? `${p.to.text}@${p.to.row}` : null,
    ]);

  it('keeps shared tokens, drops removed ones and adds new ones', () => {
    expect(pairs('let a = 1', 'let a = 2')).toEqual([
      ['1@0', null],
      ['let@0', 'let@0'],
      ['a@0', 'a@0'],
      ['=@0', '=@0'],
      [null, '2@0'],
    ]);
  });

  it('flies a moved line to its new row instead of fading it out and in', () => {
    const out = pairs('one()\ntwo()', 'two()\none()');
    expect(out).toContainEqual(['one@0', 'one@1']);
    expect(out).toContainEqual(['two@1', 'two@0']);
  });
});

describe('parseLineRanges', () => {
  it('turns 1-based ranges into 0-based rows', () => {
    expect([...(parseLineRanges('1,3-4') ?? [])]).toEqual([0, 2, 3]);
  });

  it('treats empty, all and undefined as no highlight', () => {
    expect(parseLineRanges(undefined)).toBeNull();
    expect(parseLineRanges('')).toBeNull();
    expect(parseLineRanges('all')).toBeNull();
  });

  it('throws on a malformed range', () => {
    expect(() => parseLineRanges('2-1')).toThrow(/Invalid line range/);
    expect(() => parseLineRanges('a')).toThrow(/Invalid line range/);
  });
});
