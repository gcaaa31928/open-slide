import { type CSSProperties, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  type CodeMovePair,
  type CodeToken,
  type CodeTokenKind,
  codeColumns,
  codeRows,
  matchCodeTokens,
  parseLineRanges,
  tokenizeCode,
} from '../../lib/code-move';
import { easeInOut, lerp, phaseAt, progress } from '../../lib/motion';

export type CodeMoveProps = {
  t: number;
  at: readonly number[];
  steps: readonly string[];
  highlight?: readonly (string | undefined)[];
  duration?: number;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  dim?: number;
  colors?: Partial<Record<CodeTokenKind, string>>;
  style?: CSSProperties;
};

const DEFAULT_COLORS: Record<CodeTokenKind, string | undefined> = {
  keyword: 'var(--osd-accent)',
  string: 'color-mix(in oklab, var(--osd-accent) 45%, currentColor)',
  number: 'color-mix(in oklab, var(--osd-accent) 45%, currentColor)',
  comment: 'color-mix(in oklab, currentColor 45%, transparent)',
  punct: undefined,
  word: undefined,
};

const SEP = '\u0000';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
const PROBE = 40;

// Advance widths in em. `ch` would be simpler, but Chrome falls back to 0.5em when
// it can't read a font's "0" (e.g. Nimbus Mono, the Linux default), while the
// glyphs themselves are 0.6em wide; so measure the font once instead.
type Advance = { narrow: number; wide: number };
const DEFAULT_ADVANCE: Advance = { narrow: 0.6, wide: 1 };

const probe: CSSProperties = { position: 'absolute', visibility: 'hidden', left: 0, top: 0 };

type Step = {
  tokens: CodeToken[];
  rows: number;
  cols: [number, number];
  lit: ReadonlySet<number> | null;
};

export function CodeMove({
  t,
  at,
  steps,
  highlight,
  duration = 0.8,
  fontSize = 32,
  fontFamily = MONO,
  lineHeight = 1.5,
  dim = 0.28,
  colors,
  style,
}: CodeMoveProps) {
  if (at.length !== steps.length) {
    throw new Error(`<CodeMove> needs one \`at\` per step: got ${at.length} for ${steps.length}.`);
  }
  if (highlight && highlight.length !== steps.length) {
    throw new Error(
      `<CodeMove> needs one \`highlight\` entry per step: got ${highlight.length} for ${steps.length}.`,
    );
  }
  // Keyed by content so an inline array literal doesn't re-diff the code every frame.
  const key = steps.join(SEP);
  const highlightKey = highlight?.map((h) => h ?? '').join(SEP);
  const parsed = useMemo<Step[]>(() => {
    const lits = highlightKey?.split(SEP);
    return key.split(SEP).map((code, i) => ({
      tokens: tokenizeCode(code),
      rows: codeRows(code),
      cols: codeColumns(code),
      lit: parseLineRanges(lits?.[i] || undefined),
    }));
  }, [key, highlightKey]);
  const pairs = useMemo<CodeMovePair[][]>(
    () =>
      parsed.map((s, i) =>
        i === 0 ? s.tokens.map((to) => ({ to })) : matchCodeTokens(parsed[i - 1].tokens, s.tokens),
      ),
    [parsed],
  );

  const narrowRef = useRef<HTMLSpanElement>(null);
  const wideRef = useRef<HTMLSpanElement>(null);
  const [advance, setAdvance] = useState(DEFAULT_ADVANCE);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the font changes
  useLayoutEffect(() => {
    const measure = () => {
      const n = narrowRef.current?.offsetWidth;
      const w = wideRef.current?.offsetWidth;
      if (!n || !w) return;
      const next = { narrow: n / PROBE / fontSize, wide: w / PROBE / fontSize };
      setAdvance((cur) =>
        Math.abs(cur.narrow - next.narrow) < 1e-3 && Math.abs(cur.wide - next.wide) < 1e-3
          ? cur
          : next,
      );
    };
    measure();
    let live = true;
    document.fonts?.ready.then(() => live && measure());
    return () => {
      live = false;
    };
  }, [fontFamily, fontSize]);

  const phase = phaseAt(t, at);
  const k = phase === 0 ? 1 : easeInOut(progress(t, at[phase], duration));
  const prev = parsed[Math.max(0, phase - 1)];
  const next = parsed[phase];
  const palette = { ...DEFAULT_COLORS, ...colors };
  const lit = (step: Step, row: number) => (step.lit === null || step.lit.has(row) ? 1 : dim);
  const place = (tok: CodeToken) => [tok.narrow, tok.wide, tok.row] as const;

  const height = lerp(prev.rows, next.rows, k) * lineHeight;
  const em = (narrow: number, wide: number) => narrow * advance.narrow + wide * advance.wide;
  const width = (s: Step) => em(s.cols[0], s.cols[1]);

  return (
    <div
      style={{
        position: 'relative',
        fontFamily,
        fontSize,
        lineHeight,
        whiteSpace: 'pre',
        height: `${height}em`,
        minWidth: `${Math.max(width(prev), width(next))}em`,
        ...style,
      }}
    >
      <span ref={narrowRef} aria-hidden="true" style={probe}>
        {'0'.repeat(PROBE)}
      </span>
      <span ref={wideRef} aria-hidden="true" style={probe}>
        {'字'.repeat(PROBE)}
      </span>
      {pairs[phase].map(({ from, to }, i) => {
        const tok = to ?? from;
        if (!tok) return null;
        let narrow: number;
        let wide: number;
        let row: number;
        let opacity: number;
        if (from && to) {
          const a = place(from);
          const b = place(to);
          narrow = lerp(a[0], b[0], k);
          wide = lerp(a[1], b[1], k);
          row = lerp(a[2], b[2], k);
          opacity = lerp(lit(prev, from.row), lit(next, to.row), k);
        } else if (from) {
          [narrow, wide, row] = place(from);
          opacity = (1 - progress(k, 0, 0.5)) * lit(prev, from.row);
        } else {
          [narrow, wide, row] = place(tok);
          opacity = progress(k, 0.5, 0.5) * lit(next, tok.row);
        }
        if (opacity <= 0) return null;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: pairs are positional and redrawn from t
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(${em(narrow, wide)}em, ${row * lineHeight}em)`,
              opacity,
              color: palette[tok.kind],
            }}
          >
            {tok.text}
          </span>
        );
      })}
    </div>
  );
}
