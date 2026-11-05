import { describe, expect, it } from 'vitest';
import {
  charCount,
  curvePath,
  curvePoint,
  defocus,
  easeInOut,
  easeOut,
  expoOut,
  keyframes,
  lerp,
  overshoot,
  phaseAt,
  progress,
  pulse,
  ramp,
  spring,
  typedChars,
  typingDuration,
  zoomDuration,
} from './motion';

describe('progress', () => {
  it('maps a window of time to 0…1 and clamps outside it', () => {
    expect(progress(0.5, 1, 2)).toBe(0);
    expect(progress(2, 1, 2)).toBe(0.5);
    expect(progress(9, 1, 2)).toBe(1);
  });

  it('steps instead of dividing by zero for an instant window', () => {
    expect(progress(0.99, 1, 0)).toBe(0);
    expect(progress(1, 1, 0)).toBe(1);
  });
});

describe('easing', () => {
  it('pins the ends', () => {
    for (const ease of [easeOut, easeInOut, expoOut, overshoot, spring]) {
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
    }
    expect(easeInOut(0.5)).toBe(0.5);
  });

  it('ramps with an ease-out over a default 0.6s', () => {
    expect(ramp(1, 1)).toBe(0);
    expect(ramp(1.6, 1)).toBe(1);
    expect(ramp(1.3, 1)).toBeGreaterThan(0.5);
  });

  it('overshoots past 1 before settling, for pops and toggles', () => {
    expect(overshoot(0.7)).toBeGreaterThan(1);
    expect(Math.max(...[0.6, 0.7, 0.8, 0.9].map(spring))).toBeGreaterThan(1);
  });

  it('accepts another curve for ramp', () => {
    expect(ramp(1.3, 1, 0.6, expoOut)).toBeCloseTo(expoOut(0.5));
  });

  it('interpolates linearly with lerp', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });
});

describe('phaseAt', () => {
  const starts = [0, 2.6, 5.6];

  it('picks the latest phase that has started', () => {
    expect(phaseAt(0, starts)).toBe(0);
    expect(phaseAt(3, starts)).toBe(1);
    expect(phaseAt(9, starts)).toBe(2);
  });

  it('stays on the earlier phase when parked exactly on a start', () => {
    expect(phaseAt(2.6, starts)).toBe(0);
    expect(phaseAt(5.6, starts)).toBe(1);
  });
});

describe('keyframes', () => {
  const keys = [
    [1, 0],
    [2, 100],
    [3, 100],
    [4, 0],
  ] as const;

  it('holds the first value before the first key and the last after the last', () => {
    expect(keyframes(0, keys)).toBe(0);
    expect(keyframes(9, keys)).toBe(0);
  });

  it('returns the key itself exactly at its time', () => {
    expect(keyframes(2, keys)).toBe(100);
    expect(keyframes(4, keys)).toBe(0);
  });

  it('eases between keys and holds across equal keys', () => {
    expect(keyframes(1.5, keys)).toBe(50);
    expect(keyframes(2.5, keys)).toBe(100);
    expect(keyframes(1.5, keys, (k) => k * k)).toBe(25);
  });

  it('interpolates every field of a record', () => {
    const cam = keyframes(1.5, [
      [1, { x: 0, y: 100, scale: 1 }],
      [2, { x: 200, y: 300, scale: 3 }],
    ]);
    expect(cam).toEqual({ x: 100, y: 200, scale: 2 });
  });

  it('rejects an empty key list', () => {
    expect(() => keyframes(0, [])).toThrow(/at least one key/);
  });
});

describe('curve', () => {
  it('starts and ends on its endpoints', () => {
    expect(curvePoint([0, 0], [100, 50], 0)).toEqual([0, 0]);
    expect(curvePoint([0, 0], [100, 50], 1)).toEqual([100, 50]);
    expect(curvePoint([0, 0], [100, 50], 0.5)).toEqual([50, 25]);
  });

  it('draws the same S-curve the packet rides', () => {
    expect(curvePath([0, 0], [100, 50])).toBe('M 0 0 C 50 0, 50 50, 100 50');
  });
});

describe('typing', () => {
  it('counts code points so CJK and emoji type one at a time', () => {
    expect(charCount('容器化')).toBe(3);
    expect(charCount([['const ', '#9cc0ff'], ['x = 1']])).toBe(11);
  });

  it('types at a fixed rate and clamps to the text', () => {
    expect(typedChars(0.9, 1, 10)).toBe(0);
    expect(typedChars(1.1, 1, 10)).toBe(3);
    expect(typedChars(9, 1, 10)).toBe(10);
    expect(typedChars(1.5, 1, 10, 10)).toBe(5);
  });

  it('reports how long a line takes to type', () => {
    expect(typingDuration('abcdef')).toBeCloseTo(0.2);
    expect(typingDuration('abcd', 8)).toBe(0.5);
  });
});

describe('zoomDuration', () => {
  it('takes 0.55s per doubling and clamps to 0.3–0.94s', () => {
    expect(zoomDuration(1, 2)).toBeCloseTo(0.55);
    expect(zoomDuration(2, 1)).toBeCloseTo(0.55);
    expect(zoomDuration(1, 1.1)).toBe(0.3);
    expect(zoomDuration(0.5, 8)).toBe(0.94);
  });
});

describe('defocus', () => {
  it('leaves the subject untouched at 0 and pushes it back at 1', () => {
    expect(defocus(0)).toEqual({ opacity: 1, filter: 'brightness(1) saturate(1) blur(0px)' });
    expect(defocus(1)).toEqual({ opacity: 0.4, filter: 'brightness(0.5) saturate(0.7) blur(4px)' });
  });
});

describe('pulse', () => {
  it('rises, holds and falls back to zero', () => {
    expect(pulse(0.9, 1)).toBe(0);
    expect(pulse(1.15, 1)).toBe(1);
    expect(pulse(1.4, 1)).toBe(1);
    expect(pulse(1.8, 1)).toBe(0);
    expect(pulse(9, 1)).toBe(0);
  });
});
