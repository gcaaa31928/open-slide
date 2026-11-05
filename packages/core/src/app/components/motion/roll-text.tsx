import type { CSSProperties, ReactNode } from 'react';
import { easeInOut, phaseAt, progress, ramp } from '../../lib/motion';

export type RollTextProps = {
  t: number;
  at: readonly number[];
  lines: readonly ReactNode[];
  height: number;
  duration?: number;
  style?: CSSProperties;
};

export function RollText({ t, at, lines, height, duration = 0.7, style }: RollTextProps) {
  const phase = phaseAt(t, at);
  const k =
    phase === 0 ? ramp(t, at[0] ?? 0, duration) : easeInOut(progress(t, at[phase], duration));
  const row = (content: ReactNode, offset: number, opacity: number) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${offset}%)`,
        opacity,
        whiteSpace: 'nowrap',
      }}
    >
      {content}
    </div>
  );
  return (
    <div style={{ ...style, position: 'relative', height, overflow: 'hidden' }}>
      {phase > 0 && k < 1 ? row(lines[phase - 1], -100 * k, 1 - k) : null}
      {row(lines[phase], 100 * (1 - k), k)}
    </div>
  );
}
