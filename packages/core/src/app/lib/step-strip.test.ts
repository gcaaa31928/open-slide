import { describe, expect, it } from 'vitest';
import { clampStop, stopLabel } from './step-strip';

describe('stopLabel', () => {
  it('numbers steps when the page has no timeline', () => {
    expect(stopLabel(null, 0)).toBe('0');
    expect(stopLabel(null, 3)).toBe('3');
  });

  it('shows the stop time of a timeline, trimming whole seconds', () => {
    expect(stopLabel([1, 2.8, 4.6], 0)).toBe('1s');
    expect(stopLabel([1, 2.8, 4.6], 1)).toBe('2.8s');
    expect(stopLabel([1, 2.8, 4.6], 5)).toBe('5');
  });
});

describe('clampStop', () => {
  it('keeps the stop inside 0..count', () => {
    expect(clampStop(-1, 3)).toBe(0);
    expect(clampStop(2, 3)).toBe(2);
    expect(clampStop(7, 3)).toBe(3);
    expect(clampStop(1.9, 3)).toBe(1);
  });
});
