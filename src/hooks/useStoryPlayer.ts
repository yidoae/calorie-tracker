"use client";

import { useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";

/** Longest frame gap counted, so returning to a background tab doesn't skip a story. */
const MAX_FRAME_MS = 100;

/**
 * Instagram-style stories: an index that advances when `progress` (a 0..1 motion value, bound to
 * the progress bars without re-rendering) fills up. It holds while the user presses or focuses
 * the stories, and can be stopped for good (WCAG 2.2.2). With reduced motion it starts stopped.
 */
export function useStoryPlayer(count: number, durationMs: number) {
  const reducedMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [stoppedChoice, setStoppedChoice] = useState<boolean | null>(null);
  const stopped = stoppedChoice ?? reducedMotion;
  const progress = useMotionValue(0);

  const goTo = useCallback(
    (next: number) => {
      progress.set(0);
      setIndex(((next % count) + count) % count);
    },
    [count, progress],
  );

  useAnimationFrame((_, delta) => {
    if (held || stopped || count < 2) return;
    const value = progress.get() + Math.min(delta, MAX_FRAME_MS) / durationMs;
    if (value < 1) {
      progress.set(value);
      return;
    }
    progress.set(0);
    setIndex((i) => (i + 1) % count);
  });

  return {
    index,
    progress,
    stopped,
    next: () => goTo(index + 1),
    previous: () => goTo(index - 1),
    goTo,
    hold: setHeld,
    toggleStopped: () => setStoppedChoice(!stopped),
  };
}
