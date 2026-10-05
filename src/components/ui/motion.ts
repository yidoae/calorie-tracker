import type { Transition, Variants } from "motion/react";

/*
 * Motion tokens (tofuhq "expressive motion"): springs for anything that moves or resizes, short
 * tweens for opacity. Elements enter from below and leave upwards / to the left. MotionConfig in
 * AppProviders honours prefers-reduced-motion for transforms and layout; components animating
 * other properties (numbers, stroke offsets) check useReducedMotion themselves.
 */

/** Snappy UI spring: pills, rows, panels. */
export const SPRING: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 };

/** Bouncier spring for small, celebratory things (chips popping in, ring arcs). */
export const SPRING_BOUNCY: Transition = { type: "spring", stiffness: 380, damping: 22 };

/** Gentle spring for counting numbers. */
export const SPRING_NUMBER = { stiffness: 120, damping: 22, mass: 0.6 } as const;

export const FADE: Transition = { duration: 0.2, ease: "easeOut" };

/** Rise in from 8 px below, leave 8 px upwards (the 4 px grid × 2). */
export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0, transition: SPRING },
  gone: { opacity: 0, y: -8, transition: FADE },
};

/** Delay for the n-th item of a staggered reveal, capped so long lists don't drag. */
export const staggerDelay = (index: number, step = 0.04, max = 0.32) => Math.min(index * step, max);

/** Slow, heavy spring for display type and full-screen scenes. */
export const SPRING_SCENE: Transition = { type: "spring", stiffness: 140, damping: 24, mass: 1 };

/** Ease for wipes that cover and uncover the screen (fast in the middle, soft at both ends). */
export const EASE_WIPE = [0.76, 0, 0.24, 1] as const;

/** Long, soft ease-out for dashboard reveals (rings filling, bars growing, cards rising). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** A dashboard card rising into place, staggered by its position. */
export const cardEnter = (index: number) => ({
  initial: { opacity: 0, y: 22, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.75, ease: EASE_OUT, delay: index * 0.09 },
});
