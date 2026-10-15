/*
 * npm run build -w fooddata (contracts/pipeline.md): loads the sources and the committed USDA
 * extract, resolves every food's values (USDA entry, printed label, or recipe), runs the build rules
 * and reports every failure. When the list is valid it writes the search-case test, and with
 * `-- --release <version>` the next list migration. The summary and review page come with T030.
 */
import { readdirSync, writeFileSync } from "node:fs";
import { searchCasesSql } from "./emit/searchCases.ts";
import { listMigrationSql } from "./emit/sql.ts";
import { summaryText } from "./emit/summary.ts";
import { cookedWeight, recipePer100, type Per100, type ResolvedYield } from "./recipe.ts";
import { checkFoods, type ResolvedFood } from "./rules.ts";
import { loadExtract, loadSources } from "./sources.ts";

const MIN_FOODS = 450;
const MIN_DISHES = 80;

const { usda, labels, recipes, withdrawn, searchCases, legacyIds } = await loadSources();
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
const yieldNote = (y: ResolvedYield) =>
  y.kind === "weighed" ? `weighed ${y.date}` : y.kind === "fndds" ? `FNDDS ${y.foodCode}, moisture ${y.moisturePct} %` : `${y.table}, yield ${y.yieldPct} %`;
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
    recipe: { ingredients: r.ingredients, waterG: r.waterG, cookedG, yieldNote: yieldNote(resolved) },
  });
}

errors.push(...checkFoods(foods, { legacyIds, minFoods: MIN_FOODS, minDishes: MIN_DISHES }));
const ids = new Set(foods.map((f) => f.id));
for (const c of searchCases) if (!ids.has(c.expectedId)) errors.push(`search case "${c.query}": ${c.expectedId} is not in the list`);
for (const w of withdrawn) if (ids.has(w.id)) errors.push(`${w.id}: listed and withdrawn at once`);
const dishes = foods.filter((f) => f.category === "dish").length;
console.log(`${foods.length} foods (${usda.length} USDA, ${recipes.length} recipe, ${labels.length} label), ${dishes} dishes`);
if (errors.length > 0) {
  console.error(`${errors.length} problem(s):\n${errors.map((e) => `  ${e}`).join("\n")}`);
  process.exit(1);
}

const SUPABASE = new URL("../../../supabase/", import.meta.url);
writeFileSync(new URL("tests/database/search_cases.test.sql", SUPABASE), searchCasesSql(searchCases));
writeFileSync(new URL("../out/foods.txt", import.meta.url), summaryText(foods));
console.log(`search cases: ${searchCases.length}`);

const at = process.argv.indexOf("--release");
if (at >= 0) {
  const version = process.argv[at + 1] ?? "";
  if (!/^\d{14}$/.test(version)) throw new Error("--release needs a migration version, e.g. 20261020000100");
  // Release 1 came from the retired tools/food-data (20261014000200_food_release_1.sql).
  // A rerun with the same version rewrites its own file instead of numbering a new list.
  const previous = readdirSync(new URL("migrations/", SUPABASE)).filter((f) => /_food_(release|list)_\d+\.sql$/.test(f) && !f.startsWith(version)).length;
  const file = `${version}_food_list_${previous + 1}.sql`;
  writeFileSync(new URL(`migrations/${file}`, SUPABASE), listMigrationSql(foods, withdrawn.map((w) => w.id), `Food list ${previous + 1}`));
  console.log(`wrote supabase/migrations/${file}`);
}
