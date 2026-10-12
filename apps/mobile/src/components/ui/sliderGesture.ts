/** Pure gesture rules for Slider, kept apart so node:test can check them without React Native. */

/** How far (pt) the finger must travel before a touch counts as a slide or a scroll. */
const SLOP = 6;

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

const clamp = (value: number, min: number, max: number, step: number) =>
  Number(Math.min(max, Math.max(min, value)).toFixed(decimals(step)));

/** The value under a point on the track: snapped to the step and kept within min–max. */
export function valueAt(x: number, width: number, min: number, max: number, step: number): number {
  const share = width > 0 ? Math.min(1, Math.max(0, x / width)) : 0;
  return clamp(min + Math.round((share * (max - min)) / step) * step, min, max, step);
}

/** One step up (1) or down (-1), stopping at the ends: the screen reader's increment/decrement. */
export function stepValue(value: number, direction: 1 | -1, min: number, max: number, step: number): number {
  return clamp(value + direction * step, min, max, step);
}

/**
 * What a drag means so far. Only a clearly horizontal move (more than twice as wide as tall) is a
 * slide; vertical and diagonal moves belong to the screen's scroll.
 */
export function dragIntent(dx: number, dy: number): "undecided" | "slide" | "scroll" {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SLOP) return "undecided";
  return Math.abs(dx) > 2 * Math.abs(dy) ? "slide" : "scroll";
}
