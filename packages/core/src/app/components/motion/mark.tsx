import type { CSSProperties, ReactNode } from 'react';
import { easeInOut, progress } from '../../lib/motion';

export type MarkType = 'underline' | 'circle' | 'box' | 'highlight' | 'strike';

export type MarkProps = {
  t: number;
  at: number;
  type?: MarkType;
  duration?: number;
  color?: string;
  width?: number;
  children: ReactNode;
  style?: CSSProperties;
};

type Stroke = { kind: 'line' | 'ellipse' | 'rect'; attrs: Record<string, string | number> };

// Two passes slightly off each other read as hand-drawn without any randomness,
// so the same t always draws the same frame. Percent coordinates size the marks
// to the text box without measuring it.
const STROKES: Record<MarkType, readonly Stroke[]> = {
  underline: [
    { kind: 'line', attrs: { x1: '-2%', y1: '96%', x2: '101%', y2: '93%' } },
    { kind: 'line', attrs: { x1: '3%', y1: '101%', x2: '98%', y2: '99%' } },
  ],
  strike: [
    { kind: 'line', attrs: { x1: '-2%', y1: '56%', x2: '102%', y2: '50%' } },
    { kind: 'line', attrs: { x1: '1%', y1: '50%', x2: '99%', y2: '54%' } },
  ],
  highlight: [{ kind: 'line', attrs: { x1: '-1%', y1: '58%', x2: '101%', y2: '55%' } }],
  box: [
    { kind: 'rect', attrs: { x: '-4%', y: '-8%', width: '108%', height: '116%' } },
    { kind: 'rect', attrs: { x: '-3%', y: '-5%', width: '105%', height: '111%' } },
  ],
  circle: [
    { kind: 'ellipse', attrs: { cx: '50%', cy: '52%', rx: '57%', ry: '78%' } },
    { kind: 'ellipse', attrs: { cx: '51%', cy: '49%', rx: '55%', ry: '74%' } },
  ],
};

export function Mark({
  t,
  at,
  type = 'underline',
  duration = 0.6,
  color = 'var(--osd-accent)',
  width = 4,
  children,
  style,
}: MarkProps) {
  const strokes = STROKES[type];
  const highlight = type === 'highlight';
  const share = duration / strokes.length;
  return (
    <span style={{ position: 'relative', display: 'inline-block', ...style }}>
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: highlight ? 0 : 1,
          transform: type === 'circle' ? 'rotate(-3deg)' : undefined,
        }}
      >
        {strokes.map(({ kind, attrs }, i) => {
          const k = easeInOut(progress(t, at + i * share, share));
          if (k <= 0) return null;
          const Shape = kind;
          return (
            <Shape
              // biome-ignore lint/suspicious/noArrayIndexKey: strokes are a fixed list per type
              key={i}
              {...attrs}
              fill="none"
              stroke={color}
              strokeWidth={highlight ? '0.9em' : width}
              strokeLinecap={highlight ? 'butt' : 'round'}
              strokeOpacity={highlight ? 0.3 : i === 0 ? 1 : 0.6}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - k}
            />
          );
        })}
      </svg>
      <span style={{ position: 'relative', zIndex: highlight ? 1 : 0 }}>{children}</span>
    </span>
  );
}
