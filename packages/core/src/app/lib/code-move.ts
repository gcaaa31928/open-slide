export type CodeTokenKind = 'keyword' | 'string' | 'comment' | 'number' | 'punct' | 'word';

export type CodeToken = {
  text: string;
  kind: CodeTokenKind;
  row: number;
  // Offset from the line start, split so a monospace layout can place it exactly
  // with `calc(<narrow>ch + <wide>em)`: CJK glyphs fall back to a ~1em-wide font.
  narrow: number;
  wide: number;
};

export type CodeMovePair = {
  from?: CodeToken;
  to?: CodeToken;
};

const KEYWORDS = new Set(
  (
    'abstract as async await break case catch class const continue def default defer delete do ' +
    'elif else enum export extends false final fn for from func function go if impl import in ' +
    'instanceof interface is let match mod module mut new nil none not null of or and package pass ' +
    'private protected pub public raise readonly return self static struct super switch this throw ' +
    'trait true try type typeof undefined use var void while with yield None True False'
  ).split(' '),
);

const TOKEN =
  /(\/\/.*|#(?![\w{]).*|\/\*.*?\*\/)|('(?:\\.|[^'\\])*'?|"(?:\\.|[^"\\])*"?|`(?:\\.|[^`\\])*`?)|(\b\d[\w.]*)|([\p{L}_$][\p{L}\p{N}_$]*)|(\s+)|(=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\.\.\.|::|->|\+\+|--|\S)/gu;

const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;

function measure(text: string): [narrow: number, wide: number] {
  let narrow = 0;
  let wide = 0;
  for (const ch of text) {
    if (ch === '\t') narrow += 2;
    else if (WIDE.test(ch)) wide += 1;
    else narrow += 1;
  }
  return [narrow, wide];
}

export function tokenizeCode(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  code.split('\n').forEach((line, row) => {
    let narrow = 0;
    let wide = 0;
    for (const m of line.matchAll(TOKEN)) {
      const text = m[0];
      const [n, w] = measure(text);
      if (m[5] === undefined) {
        const kind: CodeTokenKind = m[1]
          ? 'comment'
          : m[2]
            ? 'string'
            : m[3]
              ? 'number'
              : m[4]
                ? KEYWORDS.has(text)
                  ? 'keyword'
                  : 'word'
                : 'punct';
        tokens.push({ text, kind, row, narrow, wide });
      }
      narrow += n;
      wide += w;
    }
  });
  return tokens;
}

export function codeRows(code: string): number {
  return code.split('\n').length;
}

export function codeColumns(code: string): [narrow: number, wide: number] {
  let best: [number, number] = [0, 0];
  for (const line of code.split('\n')) {
    const m = measure(line);
    if (m[0] + m[1] * 2 > best[0] + best[1] * 2) best = m;
  }
  return best;
}

// Longest common subsequence first, so tokens keep their order the way a diff
// would; then any word or string left on both sides is paired by text, which is
// what lets a moved line fly to its new place instead of fading out and back in.
export function matchCodeTokens(
  from: readonly CodeToken[],
  to: readonly CodeToken[],
): CodeMovePair[] {
  const n = from.length;
  const m = to.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] =
        from[i].text === to[j].text
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const toFrom = new Array<number>(m).fill(-1);
  const fromUsed = new Array<boolean>(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (from[i].text === to[j].text) {
      toFrom[j] = i;
      fromUsed[i] = true;
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++;
    else j++;
  }
  const movable = (tok: CodeToken) => tok.kind !== 'punct' && tok.text.length > 1;
  for (let b = 0; b < m; b++) {
    if (toFrom[b] !== -1 || !movable(to[b])) continue;
    const a = from.findIndex((tok, idx) => !fromUsed[idx] && tok.text === to[b].text);
    if (a === -1) continue;
    toFrom[b] = a;
    fromUsed[a] = true;
  }
  const pairs: CodeMovePair[] = [];
  for (let a = 0; a < n; a++) if (!fromUsed[a]) pairs.push({ from: from[a] });
  for (let b = 0; b < m; b++) {
    pairs.push(toFrom[b] === -1 ? { to: to[b] } : { from: from[toFrom[b]], to: to[b] });
  }
  return pairs;
}

// "1,3-5" → rows {0, 2, 3, 4}. Empty, "all" or undefined → null (nothing dimmed).
export function parseLineRanges(spec: string | undefined): ReadonlySet<number> | null {
  if (spec === undefined) return null;
  const trimmed = spec.trim();
  if (trimmed === '' || trimmed === 'all') return null;
  const rows = new Set<number>();
  for (const part of trimmed.split(',')) {
    const m = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(part);
    if (!m) throw new Error(`Invalid line range "${part}" in "${spec}". Use e.g. "1,3-5".`);
    const a = Number(m[1]);
    const b = m[2] === undefined ? a : Number(m[2]);
    if (a < 1 || b < a) throw new Error(`Invalid line range "${part}" in "${spec}".`);
    for (let r = a; r <= b; r++) rows.add(r - 1);
  }
  return rows;
}
