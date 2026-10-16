import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Meal } from "@calorie/core/schemas/meal";
import type { FoodHit } from "@calorie/core/schemas/rows";
import {
  addFood,
  dismissUnmatched,
  fillDraftFromAi,
  dayTotals,
  draftItemMacros,
  draftReady,
  draftTotals,
  EMPTY_DRAFT,
  gramsError,
  groupBySlot,
  localDayKey,
  logMealPayload,
  MAX_DRAFT_ITEMS,
  mealNameFor,
  msUntilNextDay,
  removeDraftItem,
  resolveUnmatched,
  setDraftGrams,
  setDraftPortion,
  setDraftSlot,
} from "../src/hooks/mealLogic.ts";

const hit = (foodId: string, name: string, kcal: number, protein = 0, carbs = 0, fat = 0): FoodHit => ({
  foodId,
  name,
  matchedAlias: name.toLocaleLowerCase("tr-TR"),
  typicalPortionG: 100,
  per100g: { calories: kcal, protein, carbs, fat },
  portions: [],
});
const CHICKEN = hit("chicken_breast_grilled", "Izgara tavuk göğsü", 165, 31, 0, 3.6);
const RICE = hit("white_rice", "Pirinç pilavı", 130, 2.7, 28, 0.3);

const meal = (id: string, slot: Meal["slot"], calories: number, loggedAt: string): Meal => ({
  id,
  slot,
  localDate: "2026-10-11",
  timeZone: "Europe/Istanbul",
  loggedAt,
  name: "x",
  totals: { calories, protein: calories / 10, carbs: 1, fat: 2 },
  items: [],
});

describe("gram field", () => {
  it("starts empty and asks for grams (FR-013)", () => {
    const draft = addFood(EMPTY_DRAFT, CHICKEN);
    assert.equal(draft.items[0].gramsText, "");
    assert.equal(gramsError(""), "Kaç gram yediğini yaz.");
  });

  it("accepts more than 0 and at most 5000 g, with a Turkish decimal comma", () => {
    for (const ok of ["150", "62,5", "0.5", "5000"]) assert.equal(gramsError(ok), null, ok);
    for (const bad of ["0", "5000.1", "-5", "abc", "1e3"]) assert.equal(gramsError(bad), "Gramı 0'dan büyük, en fazla 5.000 olarak yaz.", bad);
  });
});

describe("meal draft", () => {
  it("adds, edits and removes items without touching the other items", () => {
    let draft = addFood(addFood(EMPTY_DRAFT, CHICKEN), RICE);
    const [first, second] = draft.items;
    assert.notEqual(first.key, second.key);
    draft = setDraftGrams(draft, first.key, "200");
    assert.equal(draft.items[0].gramsText, "200");
    assert.equal(draft.items[1].gramsText, "");
    draft = removeDraftItem(draft, first.key);
    assert.deepEqual(draft.items.map((i) => i.food.foodId), ["white_rice"]);
    // A food added after a removal still gets a new key.
    draft = addFood(draft, CHICKEN);
    assert.equal(new Set(draft.items.map((i) => i.key)).size, 2);
  });

  it("holds at most 30 items, like log_meal", () => {
    let draft = EMPTY_DRAFT;
    for (let i = 0; i < MAX_DRAFT_ITEMS + 3; i++) draft = addFood(draft, CHICKEN);
    assert.equal(draft.items.length, 30);
  });

  it("totals only the items with valid grams, from the per-100 g values (live preview)", () => {
    let draft = addFood(addFood(EMPTY_DRAFT, CHICKEN), RICE);
    draft = setDraftGrams(draft, draft.items[0].key, "200");
    assert.deepEqual(draftTotals(draft), { calories: 330, protein: 62, carbs: 0, fat: 7.2 });
    draft = setDraftGrams(draft, draft.items[1].key, "100");
    assert.deepEqual(draftTotals(draft), { calories: 460, protein: 64.7, carbs: 28, fat: 7.5 });
  });

  it("previews each item at its typed grams, nothing while the grams are invalid", () => {
    let draft = addFood(EMPTY_DRAFT, CHICKEN);
    assert.equal(draftItemMacros(draft.items[0]), null);
    draft = setDraftGrams(draft, draft.items[0].key, "150");
    assert.deepEqual(draftItemMacros(draft.items[0]), { calories: 248, protein: 46.5, carbs: 0, fat: 5.4 });
  });

  it("is ready to save only when it has items and every gram field is valid", () => {
    assert.equal(draftReady(EMPTY_DRAFT), false);
    let draft = addFood(EMPTY_DRAFT, CHICKEN);
    assert.equal(draftReady(draft), false);
    draft = setDraftGrams(draft, draft.items[0].key, "150");
    assert.equal(draftReady(draft), true);
    draft = addFood(draft, RICE);
    assert.equal(draftReady(draft), false);
  });

  it("builds the log_meal payload with only foods and grams, the slot and the local day", () => {
    let draft = addFood(addFood(EMPTY_DRAFT, CHICKEN), RICE);
    draft = setDraftGrams(draft, draft.items[0].key, "200");
    draft = setDraftGrams(draft, draft.items[1].key, "62,5");
    draft = setDraftSlot(draft, "dinner");
    assert.deepEqual(logMealPayload(draft, "lunch", { localDate: "2026-10-11", timeZone: "Europe/Istanbul" }), {
      slot: "dinner",
      localDate: "2026-10-11",
      timeZone: "Europe/Istanbul",
      name: "Izgara tavuk göğsü, pirinç pilavı",
      items: [
        { foodId: "chicken_breast_grilled", grams: 200 },
        { foodId: "white_rice", grams: 62.5 },
      ],
    });
  });

  it("uses the default slot until the user picks one (FR-014)", () => {
    let draft = addFood(EMPTY_DRAFT, CHICKEN);
    draft = setDraftGrams(draft, draft.items[0].key, "100");
    assert.equal(logMealPayload(draft, "breakfast", { localDate: "2026-10-11", timeZone: "Europe/Istanbul" })?.slot, "breakfast");
  });

  it("builds no payload while a gram field is invalid", () => {
    assert.equal(logMealPayload(addFood(EMPTY_DRAFT, CHICKEN), "lunch", { localDate: "2026-10-11", timeZone: "Europe/Istanbul" }), null);
  });
});

describe("meal name", () => {
  it("lists the first foods, the first one capitalised, the rest in Turkish lower case", () => {
    assert.equal(mealNameFor(["Izgara tavuk göğsü"]), "Izgara tavuk göğsü");
    assert.equal(mealNameFor(["Yoğurt", "İskender", "Ayran", "Baklava"]), "Yoğurt, iskender, ayran …");
  });

  it("stays within 80 characters", () => {
    const name = mealNameFor(["A".repeat(70), "B".repeat(70)]);
    assert.ok(name.length <= 80, name);
    assert.ok(name.endsWith("…"));
  });
});

describe("day summary", () => {
  const meals = [
    meal("00000000-0000-4000-8000-000000000003", "dinner", 600, "2026-10-11T17:00:00Z"),
    meal("00000000-0000-4000-8000-000000000001", "breakfast", 400, "2026-10-11T06:00:00Z"),
    meal("00000000-0000-4000-8000-000000000002", "breakfast", 150, "2026-10-11T07:30:00Z"),
  ];

  it("adds up the meals' server-computed totals", () => {
    assert.deepEqual(dayTotals(meals), { calories: 1150, protein: 115, carbs: 3, fat: 6 });
    assert.deepEqual(dayTotals([]), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("groups meals by slot in the order of the day, leaving out empty slots", () => {
    const groups = groupBySlot(meals);
    assert.deepEqual(
      groups.map((g) => [g.slot, g.meals.map((m) => m.id.slice(-1)), g.calories]),
      [
        ["breakfast", ["1", "2"], 550],
        ["dinner", ["3"], 600],
      ],
    );
  });
});

describe("today", () => {
  it("is the calendar day in the given time zone", () => {
    const instant = new Date("2026-10-11T22:30:00Z");
    assert.equal(localDayKey(instant, "Europe/Istanbul"), "2026-10-12");
    assert.equal(localDayKey(instant, "America/New_York"), "2026-10-11");
  });

  it("falls back to the device's day for a time zone Intl does not know", () => {
    const instant = new Date(2026, 9, 11, 12, 0);
    assert.equal(localDayKey(instant, "Mars/Olympus"), "2026-10-11");
  });

  it("waits until just after the next local midnight", () => {
    assert.equal(msUntilNextDay(new Date(2026, 9, 11, 23, 59, 30)), 30_000 + 1000);
    assert.equal(msUntilNextDay(new Date(2026, 9, 11, 0, 0, 0)), 24 * 3600_000 + 1000);
  });
});

describe("AI results in the draft (003)", () => {
  const EGG = { ...hit("egg", "Yumurta", 143, 12.6, 0.7, 9.5), portions: [{ unit: "adet", grams: 50 }] };

  it("adds the proposed foods with their grams and keeps what is already there", () => {
    const start = addFood(EMPTY_DRAFT, CHICKEN);
    const draft = fillDraftFromAi(start, [{ food: EGG, grams: 100, estimated: false }, { food: RICE, grams: 152.5, estimated: true }], [{ description: "turşu suyu", grams: 100 }]);
    assert.deepEqual(draft.items.map((i) => [i.food.foodId, i.gramsText, i.estimated]), [["chicken_breast_grilled", "", false], ["egg", "100", false], ["white_rice", "152,5", true]]);
    assert.deepEqual(draft.unmatched.map((u) => [u.description, u.grams]), [["turşu suyu", 100]]);
    assert.equal(new Set([...draft.items.map((i) => i.key), ...draft.unmatched.map((u) => u.key)]).size, 4, "keys are unique");
  });

  it("never passes the item limit", () => {
    let full = EMPTY_DRAFT;
    for (let i = 0; i < MAX_DRAFT_ITEMS - 1; i++) full = addFood(full, hit(`f${i}`, `F${i}`, 100));
    const draft = fillDraftFromAi(full, [{ food: EGG, grams: 50, estimated: true }, { food: RICE, grams: 100, estimated: true }], []);
    assert.equal(draft.items.length, MAX_DRAFT_ITEMS);
  });

  it("typing grams or picking a portion clears the estimate", () => {
    const draft = fillDraftFromAi(EMPTY_DRAFT, [{ food: EGG, grams: 120, estimated: true }, { food: RICE, grams: 150, estimated: true }], []);
    const [egg, rice] = draft.items;
    assert.equal(setDraftGrams(draft, rice.key, "160").items[1].estimated, false);
    assert.equal(setDraftPortion(draft, egg.key, { unit: "adet", count: 2 }).items[0].estimated, false);
  });

  it("an unmatched entry becomes an item when the user picks a food, or goes away", () => {
    const draft = fillDraftFromAi(EMPTY_DRAFT, [{ food: EGG, grams: 50, estimated: true }], [{ description: "pilav", grams: 150 }, { description: "su" }]);
    const [pilav, su] = draft.unmatched;
    const resolved = resolveUnmatched(draft, pilav.key, RICE);
    assert.deepEqual(resolved.items.map((i) => [i.food.foodId, i.gramsText, i.estimated]), [["egg", "50", true], ["white_rice", "150", true]]);
    assert.deepEqual(resolved.unmatched.map((u) => u.description), ["su"]);
    assert.equal(resolveUnmatched(draft, su.key, RICE).items[1].gramsText, "", "no grams → the user types them");
    assert.deepEqual(dismissUnmatched(draft, su.key).unmatched.map((u) => u.description), ["pilav"]);
  });

  it("the saved payload never holds unmatched entries", () => {
    const draft = fillDraftFromAi(EMPTY_DRAFT, [{ food: EGG, grams: 100, estimated: false }], [{ description: "turşu suyu" }]);
    const payload = logMealPayload(draft, "breakfast", { localDate: "2026-10-17", timeZone: "Europe/Istanbul" });
    assert.deepEqual(payload?.items, [{ foodId: "egg", grams: 100 }]);
  });
});
