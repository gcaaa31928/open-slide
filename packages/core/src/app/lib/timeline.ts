export function assertStops(stops: readonly number[]): void {
  if (stops.length === 0) {
    throw new Error('useTimeline needs at least one stop.');
  }
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (!Number.isFinite(s) || s < 0) {
      throw new Error(`useTimeline: stops[${i}] must be a finite number ≥ 0, got ${s}.`);
    }
    if (i > 0 && s < stops[i - 1]) {
      throw new Error(
        `useTimeline: stops must not decrease, but stops[${i}] (${s}) < stops[${i - 1}] (${stops[i - 1]}).`,
      );
    }
  }
}

export function timelineStop(
  stops: readonly number[],
  revealed: number,
): { stop: number; target: number } {
  const stop = Math.max(0, Math.min(stops.length - 1, revealed));
  return { stop, target: stops[stop] };
}

export function shouldPlayTimeline(mode: {
  hosted: boolean;
  controlled: boolean;
  isActivePage: boolean;
  reduceMotion: boolean;
}): boolean {
  return mode.hosted && !mode.controlled && mode.isActivePage && !mode.reduceMotion;
}

export function initialTime(mode: {
  play: boolean;
  entryDirection: 'forward' | 'backward' | 'jump';
  target: number;
}): number {
  return mode.play && mode.entryDirection === 'forward' ? 0 : mode.target;
}

export function advanceTime(current: number, target: number, deltaSeconds: number): number {
  if (current >= target) return target;
  return Math.min(target, current + Math.max(0, deltaSeconds));
}

// A → pressed before the clock reaches its stop lands on that stop at once, so the
// speaker never waits out a segment they have already talked past.
export function resumeFrom(current: number, previousTarget: number, target: number): number {
  return target > previousTarget && current < previousTarget ? previousTarget : current;
}
