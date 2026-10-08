import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plateName } from "@/lib/nutrition/plateName";
import { RANKING, backgroundShare, rankFoods, type FoodProbe } from "@/server/food/foodRanking";
import { estimateGrams, ownRegions } from "@/server/food/plate";
import { mealDraftSchema } from "@/types/meal";

// Three foods in a 2-d embedding space: "rice" and "pasta" have photos (probe), "soup" doesn't.
const probe: FoodProbe = {
  model: "test",
  classes: ["pasta", "rice"],
  coef: [
    [0, 4],
    [4, 0],
  ],
  intercept: [0, 0],
  zeroshot: {
    ids: ["rice", "pasta", "soup"],
    text_emb: [
      [1, 0],
      [0, 1],
      [-1, 0],
    ],
  },
};

describe("food ranking (probe + zero-shot)", () => {
  it("returns every food once, most likely first, with probabilities summing to 1", () => {
    const ranked = rankFoods([0.8, 0.6], probe);
    assert.deepEqual(ranked.map((r) => r.id).sort(), ["pasta", "rice", "soup"]);
    for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].probability >= ranked[i].probability);
    assert.ok(Math.abs(ranked.reduce((s, r) => s + r.probability, 0) - 1) < 1e-9);
  });

  it("lets the probe pick among the foods it was trained on", () => {
    assert.equal(rankFoods([1, 0], probe)[0].id, "rice");
    assert.equal(rankFoods([0, 1], probe)[0].id, "pasta");
  });

  it("still finds a food without photos when zero-shot clearly points to it", () => {
    assert.equal(rankFoods([-1, 0], probe)[0].id, "soup");
  });

  it("down-weights foods without photos", () => {
    const unweighted = { ...probe, classes: [], coef: [], intercept: [] };
    // With no trained foods only zero-shot is left, so the weight cancels out after normalising.
    // A weak signal (cosine 0.02), so zero-shot isn't saturated at 1.
    const soupAlone = rankFoods([-0.02, 0], unweighted).find((r) => r.id === "soup")!.probability;
    const soup = rankFoods([-0.02, 0], probe).find((r) => r.id === "soup")!.probability;
    assert.ok(RANKING.untrainedWeight < 1);
    assert.ok(soup < soupAlone);
  });
});

describe("background check", () => {
  const withBackground: FoodProbe = { ...probe, background: { ids: ["plate"], text_emb: [[0, -1]] } };

  it("flags a region that looks like the plate, not a food", () => {
    assert.ok(backgroundShare([0, -1], withBackground) > 0.9);
    assert.ok(backgroundShare([1, 0], withBackground) < 0.1);
  });

  it("never flags anything without background prompts", () => {
    assert.equal(backgroundShare([0, -1], probe), 0);
  });
});

/** A 10x10 grid mask covering the rectangle [x0, x1) x [y0, y1). */
function rect(x0: number, y0: number, x1: number, y1: number): Uint8Array {
  const m = new Uint8Array(100);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m[y * 10 + x] = 1;
  return m;
}

describe("plate regions", () => {
  const grid = { width: 10, height: 10 };

  it("gives cells to the smallest region, leaving the plate only its rim", () => {
    const plate = rect(0, 0, 10, 9);
    const rice = rect(1, 1, 5, 9);
    const fish = rect(5, 1, 9, 9);
    const regions = ownRegions(grid, [
      { mask: plate, score: 0.95 },
      { mask: rice, score: 0.9 },
      { mask: fish, score: 0.9 },
    ]);
    assert.deepEqual(
      regions.map((r) => r.share),
      [0.32, 0.32, 0.26],
    );
    assert.deepEqual(regions[0].box, { x0: 1, y0: 1, x1: 5, y1: 9 });
  });

  it("drops duplicates, unsure masks and crumbs", () => {
    const rice = rect(1, 1, 5, 9);
    const regions = ownRegions(grid, [
      { mask: rice, score: 0.95 },
      { mask: rect(1, 1, 5, 8), score: 0.9 }, // same region again
      { mask: rect(6, 1, 9, 9), score: 0.5 }, // unsure
      { mask: rect(9, 9, 10, 10), score: 0.99 }, // 1 cell
    ]);
    assert.equal(regions.length, 1);
    assert.deepEqual(regions[0].mask, rice);
  });

  it("estimates grams from typical portions scaled by plate share", () => {
    assert.deepEqual(
      estimateGrams([
        { portion: 150, share: 0.3 },
        { portion: 150, share: 0.1 },
      ]),
      [225, 75],
    );
    // One food alone gets its typical portion; extreme shares are clamped to 0.4x–2x.
    assert.deepEqual(estimateGrams([{ portion: 120, share: 0.05 }]), [120]);
    assert.deepEqual(
      estimateGrams([
        { portion: 100, share: 0.99 },
        { portion: 100, share: 0.01 },
      ]),
      [200, 40],
    );
  });

  it("names the plate after its biggest components", () => {
    assert.equal(plateName(["Pilav"]), "Pilav");
    assert.equal(plateName(["Pilav", "Somon"]), "Pilav ve Somon");
    assert.equal(plateName(["Pilav", "Somon", "Brokoli", "Limon"]), "Pilav, Somon ve Brokoli");
  });
});

describe("meal draft", () => {
  const item = { name: "Pilav", category: "carb", grams: 150, per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 } } as const;

  it("accepts a photo draft with per-component alternatives and a barcode draft without", () => {
    const fish = { ...item, name: "Somon", category: "protein" } as const;
    assert.ok(mealDraftSchema.safeParse({ name: "Pilav ve Somon", items: [item, fish], alternatives: [[item, { ...item, name: "Bulgur" }], [fish]] }).success);
    assert.ok(mealDraftSchema.safeParse({ name: "Pilav", items: [item] }).success);
  });
});
