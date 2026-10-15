/*
 * npm run build -w fooddata (contracts/pipeline.md): loads the sources and the committed USDA
 * extract, resolves every food's values (USDA entry, printed label, or recipe), runs the build rules
 * and reports every failure. Writing the list migration, summary and review page comes with the
 * user-story tasks (T021, T030).
 */
import { cookedWeight, recipePer100, type Per100, type ResolvedYield } from "./recipe.ts";
import { checkFoods, type ResolvedFood } from "./rules.ts";
import { loadExtract, loadSources } from "./sources.ts";

const MIN_FOODS = 450;
const MIN_DISHES = 80;

const { usda, labels, recipes, legacyIds } = await loadSources();
const extract = loadExtract();
const errors: string[] = [];
const zero: Per100 = { kcal: 0, protein: 0, carbs: 0, fat: 0, alcohol: 0 };

const foods: ResolvedFood[] = [];
for (const f of usda) {
  const e = extract.foods[String(f.fdcId)];
  if (!e) errors.push(`${f.id}: FDC ${f.fdcId} is not in sources/usda/extract.json (run npm run fetch -w fooddata)`);
  const per100 = e ? { kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat, alcohol: e.alcohol } : zero;
  foods.push({ ...f, sourceKind: "usda", sourceRef: `fdc:${f.fdcId}`, per100 });
}
for (const f of labels) {
  const { brand, product, date, ...per100 } = f.label;
  foods.push({ ...f, sourceKind: "label", sourceRef: `label:${brand} ${product}, ${date}`, brand, per100 });
}
const byId = new Map(foods.map((f) => [f.id, f]));
for (const r of recipes) {
  let resolved: ResolvedYield;
  if (r.yield.kind === "fndds") {
    const m = extract.fnddsMoisture[String(r.yield.foodCode)];
    if (!m) errors.push(`${r.id}: FNDDS ${r.yield.foodCode} is not in sources/usda/extract.json (run npm run fetch -w fooddata)`);
    resolved = { ...r.yield, moisturePct: m?.moisturePct ?? 0 };
  } else resolved = r.yield;
  const cookedG = cookedWeight({ ...r, yield: resolved });
  const parts = r.ingredients.map((i) => ({ grams: i.grams, per100: byId.get(i.foodId)?.per100 ?? zero }));
  foods.push({
    ...r,
    sourceKind: "recipe",
    sourceRef: `recipe:${r.id}`,
    per100: cookedG > 0 ? recipePer100(parts, cookedG) : zero,
    recipe: { ingredients: r.ingredients, waterG: r.waterG, cookedG },
  });
}

errors.push(...checkFoods(foods, { legacyIds, minFoods: MIN_FOODS, minDishes: MIN_DISHES }));
const dishes = foods.filter((f) => f.category === "dish").length;
console.log(`${foods.length} foods (${usda.length} USDA, ${recipes.length} recipe, ${labels.length} label), ${dishes} dishes`);
if (errors.length > 0) {
  console.error(`${errors.length} problem(s):\n${errors.map((e) => `  ${e}`).join("\n")}`);
  process.exit(1);
}
