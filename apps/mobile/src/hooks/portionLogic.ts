import { MAX_ITEM_GRAMS } from "@calorie/core/schemas/nutrition";

/*
 * Portion shortcuts on the review step (002 US2, clarify Q1): a unit chip plus a −/+ count. The
 * result is only ever written into the gram field, which stays the saved value (001 FR-013). No
 * React Native imports, so tests/portionLogic.test.ts runs this under node.
 */

export interface Portion {
  unit: string;
  grams: number;
}

/** The chosen unit and how many of it. */
export interface PortionPick {
  unit: string;
  count: number;
}

export const pickUnit = (unit: string): PortionPick => ({ unit, count: 1 });

const unitGrams = (portions: Portion[], unit: string) => portions.find((p) => p.unit === unit)?.grams ?? 0;
const totalGrams = (portions: Portion[], pick: PortionPick) => Math.round(unitGrams(portions, pick.unit) * pick.count * 10) / 10;

/** Whether −/+ may move the count: never below one, never past the 5000 g limit. */
export function canStep(portions: Portion[], pick: PortionPick, delta: 1 | -1): boolean {
  const count = pick.count + delta;
  return count >= 1 && totalGrams(portions, { ...pick, count }) <= MAX_ITEM_GRAMS;
}

export function stepPick(portions: Portion[], pick: PortionPick, delta: 1 | -1): PortionPick {
  return canStep(portions, pick, delta) ? { ...pick, count: pick.count + delta } : pick;
}

/** The grams for the pick as the gram field shows them: 0.1 g, Turkish decimal comma. */
export function gramsForPick(portions: Portion[], pick: PortionPick): string {
  return String(totalGrams(portions, pick)).replace(".", ",");
}
