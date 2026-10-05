import {
  waterEntrySchema,
  waterListSchema,
  weightEntrySchema,
  weightListSchema,
  type LogWeightInput,
  type WaterEntry,
  type WeightEntry,
} from "@/types/tracking";
import { request } from "./http";

/** Weight and water endpoints (/api/weights, /api/water). */
export const trackingService = {
  weights(): Promise<WeightEntry[]> {
    return request("/api/weights", weightListSchema);
  },
  logWeight(input: LogWeightInput): Promise<WeightEntry> {
    return request("/api/weights", weightEntrySchema, { json: input });
  },
  removeWeight(id: string): Promise<void> {
    return request(`/api/weights/${encodeURIComponent(id)}`, null, { method: "DELETE" });
  },

  water(from: Date, to: Date): Promise<WaterEntry[]> {
    const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    return request(`/api/water?${query}`, waterListSchema);
  },
  logWater(ml: number): Promise<WaterEntry> {
    return request("/api/water", waterEntrySchema, { json: { ml } });
  },
  removeWater(id: string): Promise<void> {
    return request(`/api/water/${encodeURIComponent(id)}`, null, { method: "DELETE" });
  },
};
