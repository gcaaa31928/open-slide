import { describe, expect, it } from 'vitest';
import { applyCurrent } from './current-plugin';

const page = (pageIndex: number, extra: Record<string, unknown> = {}) => ({
  slideId: 'deck',
  pageIndex,
  totalPages: 4,
  slideTitle: 'Deck',
  ...extra,
});

describe('applyCurrent', () => {
  it('records the page and leaves step null outside present mode', () => {
    expect(applyCurrent(null, page(1), 'slides')).toMatchObject({
      slideId: 'deck',
      pageNumber: 2,
      pagePath: 'slides/deck/index.tsx',
      step: null,
    });
  });

  it('records the stop the presenter is parked on', () => {
    const state = applyCurrent(null, page(1, { step: { revealed: 2, count: 3 } }), 'slides');
    expect(state?.step).toEqual({ revealed: 2, count: 3 });
  });

  it('clamps the stop and drops a step on a page without steps', () => {
    expect(
      applyCurrent(null, page(0, { step: { revealed: 9, count: 3 } }), 'slides')?.step,
    ).toEqual({ revealed: 3, count: 3 });
    expect(
      applyCurrent(null, page(0, { step: { revealed: 0, count: 0 } }), 'slides')?.step,
    ).toBeNull();
  });

  it('forgets the stop and selection when the page changes', () => {
    const parked = applyCurrent(
      null,
      page(1, {
        step: { revealed: 1, count: 2 },
        selection: { line: 3, column: 2, tagName: 'H1' },
      }),
      'slides',
    );
    const moved = applyCurrent(parked, page(2), 'slides');
    expect(moved?.step).toBeNull();
    expect(moved?.selection).toBeNull();
  });

  it('keeps the stop when only the selection changes', () => {
    const parked = applyCurrent(null, page(1, { step: { revealed: 1, count: 2 } }), 'slides');
    const picked = applyCurrent(
      parked,
      { selection: { line: 5, column: 0, tagName: 'P' } },
      'slides',
    );
    expect(picked?.step).toEqual({ revealed: 1, count: 2 });
    expect(picked?.selection).toMatchObject({ line: 5, tagName: 'p' });
  });

  it('ignores a bad slide id and messages before any page is known', () => {
    expect(applyCurrent(null, { slideId: '../etc' }, 'slides')).toBeNull();
    expect(applyCurrent(null, { selection: null }, 'slides')).toBeNull();
  });
});
