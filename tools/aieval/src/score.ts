import type { ExpectedItem } from "./cases.ts";

/*
 * Scoring shared by the text and photo reports. A phrase passes when it finds exactly the expected
 * foods with grams within 1 g (or 2 %); a photo is scored per food: recall, false positives and the
 * weight error of the foods it found (SC-001, SC-002, SC-003).
 */

export interface Predicted {
  food_id: string;
  grams: number;
}

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(1, 0.02 * b);

export function phrasePasses(predicted: Predicted[], expected: ExpectedItem[]): boolean {
  if (predicted.length !== expected.length) return false;
  return expected.every((e) => predicted.some((p) => p.food_id === e.food_id && close(p.grams, e.grams)));
}

export interface PlateScore {
  found: number;
  expected: number;
  falsePositives: number;
  proposed: number;
  /** |predicted − weighed| / weighed for each correctly found food. */
  weightErrors: number[];
}

export function scorePlate(predicted: Predicted[], expected: ExpectedItem[]): PlateScore {
  const byId = new Map(predicted.map((p) => [p.food_id, p.grams]));
  const found = expected.filter((e) => byId.has(e.food_id));
  return {
    found: found.length,
    expected: expected.length,
    falsePositives: predicted.filter((p) => !expected.some((e) => e.food_id === p.food_id)).length,
    proposed: predicted.length,
    weightErrors: found.map((e) => Math.abs((byId.get(e.food_id) ?? 0) - e.grams) / e.grams),
  };
}

export function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
