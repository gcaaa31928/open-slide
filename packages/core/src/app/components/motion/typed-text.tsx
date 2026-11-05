import { charCount, type TextSegment, TYPING_CPS, typedChars } from '../../lib/motion';

export type TypedTextProps = {
  t: number;
  at: number;
  text: string | readonly TextSegment[];
  cps?: number;
  caret?: boolean;
};

export function TypedText({ t, at, text, cps = TYPING_CPS, caret = true }: TypedTextProps) {
  const segments: readonly TextSegment[] = typeof text === 'string' ? [[text]] : text;
  const total = charCount(segments);
  const shown = typedChars(t, at, total, cps);
  const typing = t >= at && shown < total;
  let left = shown;
  return (
    <span style={{ whiteSpace: 'pre' }}>
      {segments.map(([part, color], i) => {
        const chars = [...part];
        const take = Math.min(chars.length, left);
        left -= take;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
          <span key={i} style={color ? { color } : undefined}>
            {chars.slice(0, take).join('')}
          </span>
        );
      })}
      {caret && typing ? (
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: '0.1em',
            height: '1.1em',
            marginLeft: '0.05em',
            verticalAlign: '-0.2em',
            background: 'currentColor',
          }}
        />
      ) : null}
    </span>
  );
}
