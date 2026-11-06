import { useEffect, useRef, useState } from 'react';
import { useStepBlock } from './step-context';
import {
  advanceTime,
  assertStops,
  initialTime,
  resumeFrom,
  shouldPlayTimeline,
  timelineStop,
} from './timeline';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

export type Timeline = {
  t: number;
  stop: number;
  playing: boolean;
};

export function useTimeline(stops: readonly number[]): Timeline {
  assertStops(stops);
  const block = useStepBlock(stops.length - 1, stops);
  const reduceMotion = usePrefersReducedMotion();
  const play = shouldPlayTimeline({ ...block, reduceMotion });
  const { stop, target } = timelineStop(stops, block.revealed);

  const [t, setT] = useState(() =>
    initialTime({ play, entryDirection: block.entryDirection, target }),
  );
  const tRef = useRef(t);
  const previousTargetRef = useRef(target);

  useEffect(() => {
    tRef.current = resumeFrom(tRef.current, previousTargetRef.current, target);
    previousTargetRef.current = target;
    if (!play || tRef.current >= target) {
      tRef.current = target;
      setT(target);
      return;
    }
    setT(tRef.current);
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const next = advanceTime(tRef.current, target, (now - prev) / 1000);
      prev = now;
      tRef.current = next;
      setT(next);
      if (next < target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, target]);

  // Snap-backs and non-playing modes take effect on this render, not one frame late.
  const shown = play ? Math.min(t, target) : target;
  const playing = shown < target;

  const { reportPlaying } = block;
  useEffect(() => {
    reportPlaying(playing);
  }, [reportPlaying, playing]);

  return { t: shown, stop, playing };
}
