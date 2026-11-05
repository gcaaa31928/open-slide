import { clamp01, easeInOut, lerp, progress } from '../../lib/motion';

export type CursorWaypoint = readonly [time: number, x: number, y: number];

export type CursorProps = {
  t: number;
  path: readonly CursorWaypoint[];
  clicks?: readonly number[];
  visible?: number;
  color?: string;
};

const CLICK_SECONDS = 0.5;
const ARC_PX = 40;

export function cursorPosition(t: number, path: readonly CursorWaypoint[]): [number, number] {
  if (path.length === 0) throw new Error('Cursor needs at least one waypoint.');
  let x = path[0][1];
  let y = path[0][2];
  for (let i = 0; i < path.length - 1; i++) {
    const [ta, xa, ya] = path[i];
    const [tb, xb, yb] = path[i + 1];
    if (t < ta) break;
    const k = easeInOut(progress(t, ta, tb - ta));
    x = lerp(xa, xb, k);
    y = lerp(ya, yb, k) - Math.sin(Math.PI * k) * ARC_PX;
  }
  return [x, y];
}

export function Cursor({
  t,
  path,
  clicks = [],
  visible = 1,
  color = 'var(--osd-accent)',
}: CursorProps) {
  if (visible <= 0) return null;
  const [x, y] = cursorPosition(t, path);
  const click = clicks.find((c) => t >= c && t < c + CLICK_SECONDS);
  const r = click === undefined ? 0 : progress(t, click, CLICK_SECONDS);
  const press = click === undefined ? 1 : 1 - 0.15 * Math.sin(Math.PI * clamp01(r * 3));
  return (
    <>
      {r > 0 ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: x - 34 * r,
            top: y - 34 * r,
            width: 68 * r,
            height: 68 * r,
            borderRadius: '50%',
            border: `3px solid ${color}`,
            boxSizing: 'border-box',
            opacity: (1 - r) * visible,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <svg
        aria-hidden="true"
        width={38}
        height={46}
        viewBox="0 0 18 22"
        style={{
          position: 'absolute',
          left: x - 3,
          top: y - 2,
          opacity: visible,
          transform: `scale(${press})`,
          transformOrigin: '3px 2px',
          pointerEvents: 'none',
        }}
      >
        <path
          d="M2 1.5 L2 17 L6.2 13.2 L9 19.5 L11.6 18.3 L8.9 12.2 L14.5 12.2 Z"
          fill={color}
          stroke="#fff"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}
