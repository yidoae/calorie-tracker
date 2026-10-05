import type { LogWeightInput, WaterEntry, WeightEntry } from "@/types/tracking";
import { db } from "../db";

/*
 * Body-weight and water data access. Every query is scoped to the user id; someone else's entry
 * behaves exactly like a missing one.
 */

const MAX_WEIGHT_ENTRIES = 400;

/** The user's weigh-ins, newest first (at most a little over a year of daily entries). */
export async function listWeights(userId: string): Promise<WeightEntry[]> {
  const rows = await db.weightLog.findMany({ where: { userId }, orderBy: { day: "desc" }, take: MAX_WEIGHT_ENTRIES });
  return rows.map(({ id, day, kg }) => ({ id, day, kg }));
}

/** Logs a weigh-in; logging the same day again replaces it. */
export async function logWeight(userId: string, input: LogWeightInput): Promise<WeightEntry> {
  const kg = Math.round(input.kg * 10) / 10;
  const row = await db.weightLog.upsert({
    where: { userId_day: { userId, day: input.day } },
    create: { userId, day: input.day, kg },
    update: { kg },
  });
  return { id: row.id, day: row.day, kg: row.kg };
}

export async function deleteWeight(userId: string, id: string): Promise<boolean> {
  const { count } = await db.weightLog.deleteMany({ where: { id, userId } });
  return count > 0;
}

/** Water entries with `from <= createdAt < to`, newest first. */
export async function listWater(userId: string, from: Date, to: Date): Promise<WaterEntry[]> {
  const rows = await db.waterLog.findMany({ where: { userId, createdAt: { gte: from, lt: to } }, orderBy: { createdAt: "desc" } });
  return rows.map(({ id, ml, createdAt }) => ({ id, ml, createdAt: createdAt.toISOString() }));
}

export async function logWater(userId: string, ml: number): Promise<WaterEntry> {
  const row = await db.waterLog.create({ data: { userId, ml } });
  return { id: row.id, ml: row.ml, createdAt: row.createdAt.toISOString() };
}

export async function deleteWater(userId: string, id: string): Promise<boolean> {
  const { count } = await db.waterLog.deleteMany({ where: { id, userId } });
  return count > 0;
}

/** Everything for the data export, oldest first. */
export async function exportTracking(userId: string): Promise<{ weights: WeightEntry[]; water: WaterEntry[] }> {
  const [weights, water] = await Promise.all([
    db.weightLog.findMany({ where: { userId }, orderBy: { day: "asc" } }),
    db.waterLog.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);
  return {
    weights: weights.map(({ id, day, kg }) => ({ id, day, kg })),
    water: water.map(({ id, ml, createdAt }) => ({ id, ml, createdAt: createdAt.toISOString() })),
  };
}
