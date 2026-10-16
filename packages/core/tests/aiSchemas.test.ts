import assert from "node:assert/strict";
import { test } from "node:test";
import { aiErrorSchema, aiLogRequestSchema, aiLogResponseSchema, allowanceRowSchema } from "../src/schemas/ai.ts";

const KEY = "0b7f1c2e-3d4a-4b5c-8d6e-7f8a9b0c1d2e";
const allowance = { used: 3, limit: 5, resets_at: "2026-10-17T00:00:00+03:00" };

test("a text request is trimmed and limited to 300 characters", () => {
  assert.equal(aiLogRequestSchema.parse({ request_key: KEY, kind: "text", text: "  2 yumurta " }).kind, "text");
  assert.equal(aiLogRequestSchema.safeParse({ request_key: KEY, kind: "text", text: "   " }).success, false);
  assert.equal(aiLogRequestSchema.safeParse({ request_key: KEY, kind: "text", text: "a".repeat(301) }).success, false);
});

test("a photo request needs an image and a uuid key", () => {
  assert.equal(aiLogRequestSchema.safeParse({ request_key: KEY, kind: "photo", image: "" }).success, false);
  assert.equal(aiLogRequestSchema.safeParse({ request_key: "x", kind: "photo", image: "abc" }).success, false);
  assert.equal(aiLogRequestSchema.safeParse({ request_key: KEY, kind: "video", image: "abc" }).success, false);
});

test("a response maps to camelCase and keeps the bounds", () => {
  const r = aiLogResponseSchema.parse({ items: [{ food_id: "egg", grams: 100, estimated: false }], unmatched: [{ description: "turşu suyu" }], allowance });
  assert.deepEqual(r.items, [{ foodId: "egg", grams: 100, estimated: false }]);
  assert.equal(r.allowance.resetsAt, allowance.resets_at);
  assert.equal(aiLogResponseSchema.safeParse({ items: [], unmatched: [], allowance }).success, false, "at least one item");
  assert.equal(aiLogResponseSchema.safeParse({ items: [{ food_id: "egg", grams: 5001, estimated: true }], unmatched: [], allowance }).success, false, "grams cap");
  assert.equal(aiLogResponseSchema.safeParse({ items: [{ food_id: "egg", grams: 0, estimated: true }], unmatched: [], allowance }).success, false, "positive grams");
});

test("error codes are the contract's seven", () => {
  assert.equal(aiErrorSchema.parse({ error: "limit_reached", resets_at: allowance.resets_at }).error, "limit_reached");
  assert.equal(aiErrorSchema.safeParse({ error: "boom" }).success, false);
});

test("an allowance row maps resets_at", () => {
  assert.deepEqual(allowanceRowSchema.parse(allowance), { used: 3, limit: 5, resetsAt: allowance.resets_at });
});
