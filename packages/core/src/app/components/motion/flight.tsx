import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { easeInOut, lerp, type Point, progress } from '../../lib/motion';

export type FlightProps = {
  t: number;
  at: number;
  duration?: number;
  from: Point;
  to: Point;
  text: string;
  toText?: string;
  lift?: number;
  color?: string;
  style?: CSSProperties;
};

type Measured = { key: string; from: number; to: number };

export function Flight({
  t,
  at,
  duration = 1.1,
  from,
  to,
  text,
  toText = text,
  lift = 48,
  color = 'var(--osd-accent)',
  style,
}: FlightProps) {
  const fromRef = useRef<HTMLSpanElement>(null);
  const toRef = useRef<HTMLSpanElement>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);
  // Like <Packet>, gone once it lands: the destination draws the landed line itself.
  const flying = t >= at && t < at + duration;
  const key = `${text}\u0000${toText}`;

  // Both lines share one grid cell, so the chip would keep the longer one's width
  // all the way down; measure each once so the width can follow t instead.
  useLayoutEffect(() => {
    if (!flying || measured?.key === key) return;
    const a = fromRef.current?.offsetWidth;
    if (a === undefined) return;
    setMeasured({ key, from: a, to: toRef.current?.offsetWidth ?? a });
  }, [flying, key, measured]);

  if (!flying) return null;
  const p = progress(t, at, duration);
  const k = easeInOut(p);
  const swap = progress(p, 0.35, 0.3);
  const width =
    measured?.key === key ? lerp(measured.from, measured.to, easeInOut(swap)) : undefined;
  const layer: CSSProperties = { gridArea: '1 / 1', justifySelf: 'start', whiteSpace: 'pre' };
  return (
    <div
      style={{
        position: 'absolute',
        left: lerp(from[0], to[0], k) - 12,
        top: lerp(from[1], to[1], k) - Math.sin(Math.PI * p) * lift,
        display: 'grid',
        width,
        overflow: 'hidden',
        padding: '0 12px',
        background: 'var(--osd-bg)',
        outline: `2px solid ${color}`,
        outlineOffset: -2,
        zIndex: 5,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <span
        ref={fromRef}
        style={{ ...layer, opacity: 1 - swap, transform: `translateY(${-swap * 100}%)` }}
      >
        {text}
      </span>
      {toText !== text ? (
        <span
          ref={toRef}
          aria-hidden="true"
          style={{ ...layer, opacity: swap, transform: `translateY(${(1 - swap) * 100}%)` }}
        >
          {toText}
        </span>
      ) : null}
    </div>
  );
}
