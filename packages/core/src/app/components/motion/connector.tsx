import type { ReactNode } from 'react';
import { curvePath, curvePoint, easeInOut, type Point, progress } from '../../lib/motion';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../lib/sdk';

export type ConnectorProps = {
  from: Point;
  to: Point;
  k: number;
  fade?: number;
  color?: string;
  width?: number;
  markers?: boolean;
};

export function Connector({
  from,
  to,
  k,
  fade = 1,
  color = 'var(--osd-accent)',
  width = 3,
  markers = true,
}: ConnectorProps) {
  if (k <= 0 || fade <= 0) return null;
  return (
    <svg
      aria-hidden="true"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        opacity: fade,
      }}
    >
      <path
        d={curvePath(from, to)}
        fill="none"
        stroke={color}
        strokeWidth={width}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.min(1, k)}
      />
      {markers ? (
        <>
          <circle
            cx={from[0]}
            cy={from[1]}
            r={width * 2}
            fill={color}
            opacity={Math.min(1, k * 4)}
          />
          <circle
            cx={to[0]}
            cy={to[1]}
            r={width * 2.7}
            fill="none"
            stroke={color}
            strokeWidth={width}
            opacity={k >= 1 ? 1 : 0}
          />
        </>
      ) : null}
    </svg>
  );
}

export type PacketProps = {
  t: number;
  at: number;
  duration?: number;
  from: Point;
  to: Point;
  color?: string;
  size?: number;
  label?: ReactNode;
};

export function Packet({
  t,
  at,
  duration = 0.7,
  from,
  to,
  color = 'var(--osd-accent)',
  size = 22,
  label,
}: PacketProps) {
  // Gone the moment it lands, so a page parked on a stop never shows a packet
  // frozen on top of its destination.
  if (t < at || t >= at + duration) return null;
  const [x, y] = curvePoint(from, to, easeInOut(progress(t, at, duration)));
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 0 ${size / 4}px color-mix(in srgb, ${color} 20%, transparent)`,
          pointerEvents: 'none',
        }}
      />
      {label != null ? (
        <div
          style={{
            position: 'absolute',
            left: x + size,
            top: y - size * 1.8,
            padding: '0 6px',
            fontSize: 22,
            color,
            background: 'var(--osd-bg)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
}
