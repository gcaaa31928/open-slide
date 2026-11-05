export type Point = readonly [x: number, y: number];

export type Keyframe<V> = readonly [time: number, value: V];

export type Easing = (k: number) => number;

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function progress(t: number, start: number, duration: number): number {
  if (duration <= 0) return t >= start ? 1 : 0;
  return clamp01((t - start) / duration);
}

export function easeOut(k: number): number {
  return 1 - (1 - k) ** 3;
}

export function easeInOut(k: number): number {
  return k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
}

export function expoOut(k: number): number {
  return k >= 1 ? 1 : 1 - 2 ** (-10 * k);
}

export function overshoot(k: number): number {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2;
}

export function spring(k: number): number {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  return 2 ** (-10 * k) * Math.sin(((k * 10 - 0.75) * 2 * Math.PI) / 3) + 1;
}

export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

export function ramp(t: number, start: number, duration = 0.6, ease: Easing = easeOut): number {
  return ease(progress(t, start, duration));
}

// 0 → 1 → 0 around a moment: a button press, a highlight that comes and goes.
export function pulse(t: number, at: number, rise = 0.15, hold = 0.35, fall = 0.3): number {
  return easeInOut(progress(t, at, rise)) * (1 - easeInOut(progress(t, at + rise + hold, fall)));
}

// Same perceived speed for every push: 1× → 2× takes 0.55 s, tiny nudges
// bottom out at 0.3 s and huge moves top out at 0.94 s.
export function zoomDuration(fromScale: number, toScale: number): number {
  const seconds = (0.55 * Math.abs(Math.log(toScale / fromScale))) / Math.LN2;
  return Math.max(0.3, Math.min(0.94, seconds));
}

// Pushes everything except the subject back a layer: dimmer, greyer, softer.
// Blur is what sells the depth; opacity alone leaves the background sharp.
export function defocus(k: number): { opacity: number; filter: string } {
  const f = clamp01(k);
  return {
    opacity: 1 - 0.6 * f,
    filter: `brightness(${1 - 0.5 * f}) saturate(${1 - 0.3 * f}) blur(${4 * f}px)`,
  };
}

// Strictly after: a page parked exactly on a stop must not flip to the phase
// that starts at that same second.
export function phaseAt(t: number, starts: readonly number[]): number {
  let phase = 0;
  for (let i = 1; i < starts.length; i++) {
    if (t > starts[i]) phase = i;
  }
  return phase;
}

type Interpolatable = number | Readonly<Record<string, number>>;

function mix<V extends Interpolatable>(a: V, b: V, k: number): V {
  if (typeof a === 'number') return lerp(a, b as number, k) as V;
  const out: Record<string, number> = {};
  for (const key of Object.keys(a)) {
    out[key] = lerp(a[key], (b as Record<string, number>)[key], k);
  }
  return out as V;
}

export function keyframes<V extends Interpolatable>(
  t: number,
  keys: readonly Keyframe<V>[],
  ease: Easing = easeInOut,
): V {
  if (keys.length === 0) throw new Error('keyframes needs at least one key.');
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = keys.length - 1; i >= 0; i--) {
    const [at, value] = keys[i];
    if (t < at) continue;
    const next = keys[i + 1];
    if (!next) return value;
    return mix(value, next[1], ease(progress(t, at, next[0] - at)));
  }
  return keys[0][1];
}

// One S-curve shared by <Connector> and <Packet>: leave horizontally, arrive
// horizontally, with both control points on the vertical midline.
export function curvePath(from: Point, to: Point): string {
  const mx = (from[0] + to[0]) / 2;
  return `M ${from[0]} ${from[1]} C ${mx} ${from[1]}, ${mx} ${to[1]}, ${to[0]} ${to[1]}`;
}

export function curvePoint(from: Point, to: Point, u: number): Point {
  const mx = (from[0] + to[0]) / 2;
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const c = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return [a * from[0] + (b + c) * mx + d * to[0], (a + b) * from[1] + (c + d) * to[1]];
}

export const TYPING_CPS = 30;

export type TextSegment = readonly [text: string, color?: string];

export function charCount(text: string | readonly TextSegment[]): number {
  if (typeof text === 'string') return [...text].length;
  return text.reduce((n, [s]) => n + [...s].length, 0);
}

// The epsilon absorbs float error like 1.2 - 1 = 0.1999…, which would otherwise
// leave a page parked on a stop one character short.
export function typedChars(t: number, start: number, total: number, cps = TYPING_CPS): number {
  return Math.max(0, Math.min(total, Math.floor((t - start) * cps + 1e-6)));
}

export function typingDuration(text: string | readonly TextSegment[], cps = TYPING_CPS): number {
  return charCount(text) / cps;
}
