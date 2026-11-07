// Shared write-suppression window for dev HMR.
//
// When the notes plugin writes a slide file in response to a speaker-note
// edit, that file change fires an HMR update. Two plugins need to recognise
// the write as self-induced so they can leave the slide canvas alone:
//   - notes-plugin suppresses React Fast Refresh (RFR remounts the tree and
//     steals textarea focus mid-typing);
//   - open-slide-plugin must NOT broadcast `open-slide:slide-changed`, which
//     bumps the dev `loadSlide` cache-bust token and forces a module reload
//     and remount.
//
// A change event only counts as ours while the file holds exactly what one of
// our writes put there. A page delete, duplicate or reorder landing inside the
// window rewrites the same path with different content; matching on the path
// alone swallowed that update and left the browser with a stale page list.
// Every write inside the window is kept, not just the latest, so an event for
// an earlier save that is processed after a later one was recorded still
// matches. Add and unlink events carry no content, so they keep the path-only
// check.
//
// Both plugins consult this single shared window. Entries are time-bounded and
// pruned lazily, so the check is non-consuming and independent of the order in
// which Vite invokes each plugin's `handleHotUpdate`.

type RecentWrite = { at: number; content: string };

const recentWrites = new Map<string, RecentWrite[]>();

export const RECENT_WRITE_WINDOW_MS = 1500;

function liveWrites(file: string, now: number): RecentWrite[] {
  const live = (recentWrites.get(file) ?? []).filter((w) => now - w.at < RECENT_WRITE_WINDOW_MS);
  if (live.length === 0) recentWrites.delete(file);
  else recentWrites.set(file, live);
  return live;
}

/** Record that `file` was just written by us with exactly `content`. */
export function recordWrite(file: string, content: string, now: number = Date.now()): void {
  recentWrites.set(file, [...liveWrites(file, now), { at: now, content }]);
}

/**
 * True if `file` was recorded within the recent-write window. Expired entries
 * are pruned so a stale path can no longer suppress a later genuine edit.
 */
export function hasRecentWrite(file: string, now: number = Date.now()): boolean {
  return liveWrites(file, now).length > 0;
}

/**
 * True if `file` was recorded within the window and `read()` returns exactly
 * what one of those writes put there. `read` is only called when an entry
 * exists.
 */
export async function isRecentWrite(
  file: string,
  read: () => string | Promise<string>,
  now: number = Date.now(),
): Promise<boolean> {
  const live = liveWrites(file, now);
  if (live.length === 0) return false;
  const content = await read();
  return live.some((w) => w.content === content);
}
