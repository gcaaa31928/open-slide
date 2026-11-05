# In-page timelines (`useTimeline`)

> Reach for `<Steps>` first (`steps.md`). A timeline is for pages where things *move* — a camera pushing in, a cursor travelling to a button, code typing itself out — not for pages where blocks simply appear in order.

`useTimeline(stops)` gives a page a clock in seconds. Every animated value on the page is a function of `t`. The page plays from `0` to `stops[0]` when it is entered, then parks; each `→` plays on to the next stop and parks again. `→` at the last stop advances to the next page, `←` snaps back one stop. It plugs into the same step system as `<Steps>`, so the presenter's step counter, `?step=n` previews, and overview jumps all work without extra code.

```tsx
import { Connector, type Page, progress, ramp, useTimeline } from '@open-slide/core';

const Pipeline: Page = () => {
  // Enter: play 0 → 1.2s and park. → plays to 3.0s, → again to 5.0s.
  const { t } = useTimeline([1.2, 3.0, 5.0]);
  const title = ramp(t, 0);
  const card = ramp(t, 1.2, 0.8);
  const arrow = progress(t, 3.0, 1.0);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--osd-bg)' }}>
      <h1 style={{ position: 'absolute', left: 120, top: 120, opacity: title, transform: `translateY(${(1 - title) * 24}px)` }}>
        Request pipeline
      </h1>
      <div style={{ position: 'absolute', left: 120, top: 420, opacity: card, transform: `translateX(${(1 - card) * -40}px)` }}>
        …
      </div>
      <Connector from={[600, 500]} to={[1200, 500]} k={arrow} />
    </div>
  );
};
```

## Contract

- `useTimeline(stops: readonly number[]) => { t, stop, playing }`
  - `stops` — seconds, at least one, each `≥ 0` and never smaller than the one before. `stops[0]` is where the page parks after entering; `stops[i]` is where it parks after the `i`-th `→`. The page therefore takes `stops.length - 1` presses before `→` leaves it. Invalid stops throw while rendering (the preview reports it as an error).
  - `t` — current time in seconds. Derive every animated style from it; don't start CSS animations or timers of your own on a timeline page.
  - `stop` — index of the stop the page is parked at, or heading to.
  - `playing` — `true` while `t` is still moving toward that stop.
- Call it once per page — normally in the page component — and pass `t` down as a prop to the parts that animate.
- Playback is real time: `t` advances one second per second. Pressing `→` mid-segment lands on the stop being approached at once, then plays on to the next one, so a speaker who has already moved on never waits out a segment.

## Where `t` lands

| Where the page is shown | `t` |
| --- | --- |
| Present mode, entered forward (`→` from the previous page) | plays `0 → stops[0]`, then each `→` plays to the next stop |
| Present mode, entered backward, or by skipping over pages (overview grid, `Home`/`End`, typing a page number) | snaps to the last stop |
| `←` on a timeline page | snaps to the previous stop |
| Thumbnails, editor canvas, overview grid, export / print | last stop |
| Preview `?step=n`, presenter view panes | `stops[n]`, snapped |
| `prefers-reduced-motion: reduce` | snaps to each stop instead of playing |

Because so many surfaces show the last stop, **the page at its last stop must read as a complete slide** — that is what thumbnails, PDFs and anyone jumping in will see.

## Rules

- **One timeline per page, and no `<Steps>` on the same page.** A `<Steps>` block registers before the page's timeline, so `→` would reveal its steps first and the timeline second — rarely what you meant. Put every beat on the timeline instead.
- **Keep segments short.** 0.4–1.2 s per movement; park within ~2 s of a press. The speaker is waiting on the animation.
- **Animate `transform` and `opacity`.** Re-rendering every frame is fine; layout-changing properties (`width`, `top`, `font-size`) on large trees are not.
- **Use the motion kit before writing your own.** `ramp`, `progress`, `keyframes`, `phaseAt`, `pulse`, `<Connector>`, `<Packet>`, `<Flight>`, `<Camera>`, `<Cursor>`, `<TypedText>`, `<Headline>`, `<RollText>`, `<CodeMove>`, `<Mark>` and `<CountUp>` all come from `@open-slide/core` and are pure functions of `t`. See `motion.md`.
- **Leave a beat after the last move.** Put each stop 0.2–0.4 s after the last movement of its segment ends, so the page has settled when it parks.
- **Mark mock UI as a mock.** A fake app window, chat, or terminal gets a small "示意 / mock" label on screen and in the notes.
- **Plan stops around what the speaker says.** Each stop is a sentence: "Here's the request —" (→) "— it hits the cache —" (→) "— and misses."

## Anti-patterns

- ❌ A timeline whose only motion is blocks fading in one after another. That is `<Steps>`.
- ❌ An empty or half-built last stop. Thumbnails, exports and overview jumps show the last stop.
- ❌ `setTimeout` / `setInterval` / CSS `@keyframes` running alongside the timeline. They ignore `←`, previews and reduced motion; drive everything from `t`.
- ❌ Calling `useTimeline` twice on a page. The two clocks would take turns consuming `→`.
- ❌ Decreasing or negative stops.
- ❌ `Math.random()` or `Date.now()` in anything drawn. The same `t` must always draw the same frame, or thumbnails, exports and previews disagree with the talk.
- ❌ Switching a phase with `t >= at`. A page parked exactly on a stop would already show the next phase; use `phaseAt` (strictly after) or `t > at`.
