# Motion kit (for `useTimeline` pages)

Everything here is a pure function of the timeline's `t` (seconds). Pass `t` in; nothing keeps its own clock, so `←`, previews, thumbnails, exports and reduced motion all stay correct for free. Read `timeline.md` first — this file only covers the parts you build a timeline page from.

```tsx
import {
  Camera, Connector, Cursor, Flight, Headline, Packet, RollText, TypedText,
  keyframes, phaseAt, progress, pulse, ramp, lerp, easeInOut, easeOut, expoOut, overshoot, spring,
  zoomDuration, defocus,
  useTimeline, type Page, type Point,
} from '@open-slide/core';
```

## Math

| Function | Returns | Use for |
| --- | --- | --- |
| `progress(t, start, duration)` | linear 0→1 over `[start, start + duration]`, clamped | anything you ease yourself; a line drawing at constant speed |
| `ramp(t, start, duration = 0.6, ease = easeOut)` | `ease(progress(…))` | entrances: fade in, slide in, scale up. The workhorse — most animated values on a page are one `ramp` |
| `easeOut(k)`, `easeInOut(k)` | eased 0→1 | `easeInOut` for things that travel from A to B and stop (cameras, packets, cursors) |
| `expoOut(k)` | fast start, long soft brake | panels and cards that should land with weight: `ramp(t, at, 0.6, expoOut)` |
| `overshoot(k)`, `spring(k)` | passes 1, then settles | a toggle knob, a button pop, a chip snapping into place. Never on a camera |
| `zoomDuration(fromScale, toScale)` | seconds, 0.3–0.94 | how long a camera push or pull should take: 0.55 s per doubling, so every zoom reads at the same speed |
| `defocus(k)` | `{ opacity, filter }` to spread into `style` | pushing everything except the subject back a layer while the camera or a highlight lands on it |
| `pulse(t, at, rise = 0.15, hold = 0.35, fall = 0.3)` | 0→1, holds, back to 0 | something that comes and goes around one moment: a button pressed, a row flashing as it is read, a highlight on the line being talked about |
| `lerp(a, b, k)` | `a + (b - a) * k` | turn a 0→1 value into pixels, scale, colour channels |
| `keyframes(t, [[time, value], …], ease = easeInOut)` | the value at `t` | several moves of one thing: a camera path, a number that rises then falls. Values are numbers or flat `{ x, y, scale }` records. Holds the first value before the first key and the last after the last; repeat a key to hold |
| `phaseAt(t, starts)` | index of the latest phase whose start `t` is **strictly** past | switching text or state per stop without flipping early when parked on a stop |
| `curvePoint(from, to, u)` / `curvePath(from, to)` | point / SVG `d` on the S-curve `Connector` and `Packet` use | putting your own label or marker on a connector |
| `typingDuration(text, cps = 30)` | seconds a `TypedText` line takes | scheduling the next stop after a line finishes |

## Components

All of these position themselves in canvas pixels (1920×1080) with `position: absolute`, so put them directly in the page root (or inside `<Camera>`). Colours default to `var(--osd-accent)`.

- **`<Connector from={[x, y]} to={[x, y]} k={0..1} fade? color? width? markers? />`** — an S-curve that draws itself as `k` goes 0→1, with a dot at the start and a ring at the end once it lands (`markers={false}` drops both). Renders nothing while `k` or `fade` is 0. Draw a wire that lights up after a packet passes by stacking two: a dim one with `color` set to your line colour, and a bright one whose `k` follows the packet.
- **`<Packet t at duration={0.7} from to color? size? label? />`** — a dot riding the same S-curve during `[at, at + duration)`. It disappears on arrival, so a page parked on a stop never shows it frozen on its target. For a multi-hop route, chain one `<Packet>` per hop with back-to-back `at`s.
- **`<Flight t at duration={1.1} from={[x, y]} to={[x, y]} text toText? lift={48} color? style? />`** — a line of text lifting off `from`, travelling in a shallow arc and settling on `to`, rolling from `text` to `toText` mid-air (a YAML key landing as a C++ signature, a config line landing in a generated file). Points are the top-left of the line on each side. Like `<Packet>` it is gone on landing, so draw the landed line in the destination from `at + duration` on. It inherits font and colour; pass your code typography through `style`. Stagger several flights by ~0.5 s rather than sending them together.
- **`<Camera x y scale anchor={[960, 540]}>…</Camera>`** — pans and zooms everything inside it: world point `(x, y)` lands on screen point `anchor`, magnified `scale` times. Drive it with `keyframes` and spread the result: `<Camera {...keyframes(t, CAM_KEYS)}>`. Move `anchor` down (e.g. `[960, 680]`) when a title band sits on top, and paint that band *after* the camera with a solid `var(--osd-bg)` background so zoomed content slides under it. Plan each move as push in 0.8 s → hold ~1 s → pull back 0.8 s, and make the last stop the pulled-back view.
- **`<Cursor t path={[[time, x, y], …]} clicks={[time, …]} visible={0..1} color? />`** — a fake pointer that waits at the first waypoint, arcs between waypoints, and shows a press + ripple for 0.5 s at each click time. Aim waypoints a few pixels inside the target, and fade `visible` out before the camera moves.
- **`<TypedText t at text cps={30} caret? />`** — types `text` (a string, or `[text, color?][]` segments for syntax colours) one code point per tick, with a caret only while typing. Inherits font and colour from its parent, so wrap it in your code-panel styling. Start each line after the stop before it, or a page parked on that stop shows half a line.
- **`<Headline t at={[0, 2.6, 5.6]} titles={[…]} subs={[…]} titleHeight={120} subHeight={48} morphId? style? titleStyle? subStyle? />`** — the page's title and its one-line sub, changing per stop: the old title exits upward while the new one rises into its box, and the sub follows 0.1 s later with a short lift. The first title stands still (no entrance roll), so a page can be cut to with `morphId` and the box carries over from the previous page. For that continuity, make each chapter page's **first** title the previous page's **last** title, give every chapter page the same `morphId` and the same morph transition (forward and backward), and keep the `<Headline>` outside any `<Camera>`. Position it with `style`; never put a `transform` on it.
- **`<RollText t at={[0, 2.6, 5.6]} lines={[…]} height={92} style? />`** — a title that rolls up to the next line at each start, split-flap style. Uses `phaseAt`, so a page parked exactly on `2.6` still shows the first line. Give it the title's typography through `style` and an explicit `height` (one line).

## Pacing

- **Entrances in a list stagger** by 0.03–0.15 s: `ramp(t, start + i * 0.08)`.
- **Hold before the payoff.** Leave ~0.5 s of nothing before a key result appears, so the room has a beat to anticipate it.
- **Camera budget.** Push only for a real subject, not for an isolated blink-and-miss action. Pick a tier — 1.3× hint, 1.45× a panel or code block, 1.8× one button or number, 2.3× at most — and time the move with `zoomDuration`. Arrive ~0.15 s before the action starts, hold ~1.2 s after it ends, then pull back. Ease cameras with `easeInOut` (the `keyframes` default), never with `overshoot`/`spring`.
- **One region moves at a time.** When a page has two areas (a log or chat panel and a diagram), let them take turns: the panel runs, slows down line by line into the key line (gaps of roughly 0.6 → 0.9 → 1.2 → 1.5 s), holds there ~1.6 s, and only then does the diagram play that beat. The room reads left, then right. Put the stop after the diagram settles, not before.
- **Continuity across pages.** When a page continues the previous one, open it on the previous page's last state (same panel lines, same camera), not on an empty stage.
- **Focus = defocus the rest.** When the camera or a highlight settles on one thing, ramp `defocus(k)` on its neighbours instead of only lowering their opacity.

## Rules

- **Morph elements never go inside `<Camera>`,** and nothing animated may put a `transform` on a `MorphElement` — the morph measures pixel-constant geometry (see `morph.md`).
- **Every moving thing derives from `t`.** No `Math.random()`, `Date.now()`, CSS `transition`/`@keyframes`, or `setTimeout` on a timeline page.
- **Keep coordinates as named constants** (`const TOGGLE: Point = [858, 540]`) and point the cursor, connectors and camera at the same constants, so moving a box moves everything aimed at it.
- **Drive the diagram from the real artifact.** Import the actual file (`import spec from './assets/openapi.yaml?raw'`) and derive counts, names and highlighted rows from it at module level, throwing if its shape is not what the page expects. A page that silently draws stale numbers is worse than one that fails to load.
- **Never animate a success the source does not show.** If a beat is cued off a recording or log, check the result (exit code, status) where you read the cue and throw on failure. A stand-in for material you don't have yet says so on the page (`示意` / `mock`).
- **Don't reach into the framework's step internals** (`__open_slide_step_host_context__`, watching `data-osd-step` with a `MutationObserver`, invisible `<Step>`s that count presses). `useTimeline` already gives you the stop count, the entry direction and parking at each stop.
- **Build the page around its last stop.** That is what the editor, thumbnails and exports show: camera pulled back, every line typed, every connector drawn.
