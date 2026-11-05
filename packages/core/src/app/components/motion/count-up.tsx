import type { CSSProperties } from 'react';
import { easeOut, lerp, progress } from '../../lib/motion';

export type CountUpProps = {
  t: number;
  at: number;
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  format?: (value: number) => string;
  style?: CSSProperties;
};

export function CountUp({
  t,
  at,
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  format,
  style,
}: CountUpProps) {
  const value = lerp(from, to, easeOut(progress(t, at, duration)));
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {format ? format(rounded) : rounded.toFixed(decimals)}
    </span>
  );
}
