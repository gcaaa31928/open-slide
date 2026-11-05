import { describe, expect, it } from 'vitest';
import {
  advanceTime,
  assertStops,
  initialTime,
  resumeFrom,
  shouldPlayTimeline,
  timelineStop,
} from './timeline';

describe('assertStops', () => {
  it('accepts non-decreasing, non-negative stops', () => {
    expect(() => assertStops([0])).not.toThrow();
    expect(() => assertStops([1.5, 1.5, 4])).not.toThrow();
  });

  it('rejects an empty list', () => {
    expect(() => assertStops([])).toThrow(/at least one stop/);
  });

  it('rejects decreasing stops', () => {
    expect(() => assertStops([2, 1])).toThrow(/stops\[1\]/);
  });

  it('rejects negative and non-finite stops', () => {
    expect(() => assertStops([-1])).toThrow(/stops\[0\]/);
    expect(() => assertStops([1, Number.NaN])).toThrow(/stops\[1\]/);
    expect(() => assertStops([1, Number.POSITIVE_INFINITY])).toThrow(/stops\[1\]/);
  });
});

describe('timelineStop', () => {
  it('maps the revealed count to a stop index and time', () => {
    expect(timelineStop([1, 3, 6], 0)).toEqual({ stop: 0, target: 1 });
    expect(timelineStop([1, 3, 6], 2)).toEqual({ stop: 2, target: 6 });
  });

  it('clamps a revealed count past the last stop', () => {
    expect(timelineStop([1, 3], 5)).toEqual({ stop: 1, target: 3 });
  });
});

describe('shouldPlayTimeline', () => {
  const base = { hosted: true, controlled: false, isActivePage: true, reduceMotion: false };

  it('plays only on the active, uncontrolled page', () => {
    expect(shouldPlayTimeline(base)).toBe(true);
  });

  it('snaps in thumbnails, previews, the presenter, outgoing pages and reduced motion', () => {
    expect(shouldPlayTimeline({ ...base, hosted: false })).toBe(false);
    expect(shouldPlayTimeline({ ...base, controlled: true })).toBe(false);
    expect(shouldPlayTimeline({ ...base, isActivePage: false })).toBe(false);
    expect(shouldPlayTimeline({ ...base, reduceMotion: true })).toBe(false);
  });
});

describe('initialTime', () => {
  it('starts from zero only when a playing page is entered forward', () => {
    expect(initialTime({ play: true, entryDirection: 'forward', target: 2 })).toBe(0);
  });

  it('starts at the target on backward and jump entries, even for a single stop', () => {
    expect(initialTime({ play: true, entryDirection: 'backward', target: 2 })).toBe(2);
    expect(initialTime({ play: true, entryDirection: 'jump', target: 2 })).toBe(2);
  });

  it('starts at the target when the page does not play', () => {
    expect(initialTime({ play: false, entryDirection: 'forward', target: 2 })).toBe(2);
  });
});

describe('advanceTime', () => {
  it('moves toward the target in real time', () => {
    expect(advanceTime(1, 3, 0.5)).toBe(1.5);
  });

  it('never overshoots the target', () => {
    expect(advanceTime(2.9, 3, 0.5)).toBe(3);
  });

  it('snaps back when the target is behind', () => {
    expect(advanceTime(5, 3, 0.016)).toBe(3);
  });

  it('ignores negative frame deltas', () => {
    expect(advanceTime(1, 3, -1)).toBe(1);
  });
});

describe('resumeFrom', () => {
  it('jumps to the stop being approached when → raises the target mid-segment', () => {
    expect(resumeFrom(0.1, 1, 3)).toBe(1);
  });

  it('keeps the clock where it is once the previous stop was reached', () => {
    expect(resumeFrom(1, 1, 3)).toBe(1);
    expect(resumeFrom(0.4, 1, 1)).toBe(0.4);
  });

  it('leaves a ← to the snap-back', () => {
    expect(resumeFrom(2.5, 3, 1)).toBe(2.5);
  });
});
