import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Database } from "../src/db/database.types.ts";
import { workoutProgramSchema, workoutSessionRowSchema } from "../src/schemas/workout.ts";

type SessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];

describe("workout rows", () => {
  it("a stored session maps to camelCase", () => {
    const row: Omit<SessionRow, "user_id"> = {
      id: "6f1c2c47-5d7e-4c7b-9b3e-1f2a3b4c5d6e",
      performed_on: "2026-10-25",
      day_name: "Push",
      exercises: [{ name: "Bench press", sets: [{ kg: 62.5, reps: 6 }] }],
      created_at: "2026-10-25T18:00:00Z",
    };
    assert.deepEqual(workoutSessionRowSchema.parse(row), {
      id: row.id,
      performedOn: "2026-10-25",
      dayName: "Push",
      exercises: [{ name: "Bench press", sets: [{ kg: 62.5, reps: 6 }] }],
      createdAt: "2026-10-25T18:00:00Z",
    });
  });

  it("a program keeps the database's limits: 1–7 days, no blank names", () => {
    const day = { name: "Push", exercises: [] };
    assert.ok(workoutProgramSchema.safeParse({ name: "P", split: "PPL", days: [day] }).success);
    assert.ok(!workoutProgramSchema.safeParse({ name: "P", split: "PPL", days: [] }).success);
    assert.ok(!workoutProgramSchema.safeParse({ name: "P", split: "PPL", days: Array(8).fill(day) }).success);
    assert.ok(!workoutProgramSchema.safeParse({ name: "  ", split: "PPL", days: [day] }).success);
  });
});
