/*
 * npm run fetch -w fooddata (research.md §1, contracts/pipeline.md): downloads the pinned FDC zips
 * into .cache/ (once), checks their SHA-256 against sources/usda/release.json, and writes
 * sources/usda/extract.json with only the FDC ids and FNDDS food codes the sources use. Needs the
 * network; the build itself never does.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadSources, EXTRACT, SOURCES } from "./sources.ts";
import { usdaReleaseSchema, type UsdaExtract } from "./schemas.ts";
import { csvRows, readZipMember } from "./zip.ts";

const CACHE = new URL("../.cache/", import.meta.url);
// FDC nutrient ids; energy prefers kcal (1008), then the Atwater-specific and general values.
const ENERGY = ["1008", "2048", "2047"] as const;
const NUTRIENT = { "1003": "protein", "1004": "fat", "1005": "carbs", "1018": "alcohol" } as const;

async function download(name: string, url: string, sha256: string): Promise<Buffer> {
  mkdirSync(CACHE, { recursive: true });
  const file = new URL(name, CACHE);
  if (!existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const data = readFileSync(file);
  const actual = createHash("sha256").update(data).digest("hex");
  if (actual !== sha256) throw new Error(`${name}: SHA-256 ${actual}, release.json pins ${sha256}`);
  return data;
}

/** Rows of a zip member as objects keyed by the CSV header. */
function* table(zip: Buffer, member: string): Generator<Record<string, string>> {
  const rows = csvRows(readZipMember(zip, `/${member}`).toString("utf8"));
  const first = rows.next();
  if (first.done) return;
  const header = first.value;
  for (const row of rows) yield Object.fromEntries(header.map((h, i) => [h, row[i] ?? ""]));
}

const release = usdaReleaseSchema.parse(JSON.parse(readFileSync(new URL("usda/release.json", SOURCES), "utf8")));
const { usda, recipes } = await loadSources();
const fdcIds = new Set(usda.map((f) => String(f.fdcId)));
const foodCodes = new Set(recipes.flatMap((r) => (r.yield.kind === "fndds" ? [String(r.yield.foodCode)] : [])));

const extract: UsdaExtract = { release: release.release, foods: {}, fnddsMoisture: {} };
const nutrients = new Map<string, Record<string, number>>();

for (const f of release.files) {
  const zip = await download(f.name, f.url, f.sha256);
  if (f.name.includes("survey")) {
    const codeByFdc = new Map<string, string>();
    for (const r of table(zip, "survey_fndds_food.csv")) if (foodCodes.has(r.food_code)) codeByFdc.set(r.fdc_id, r.food_code);
    const descriptions = new Map<string, string>();
    for (const r of table(zip, "food.csv")) if (codeByFdc.has(r.fdc_id)) descriptions.set(r.fdc_id, r.description);
    for (const r of table(zip, "food_attribute.csv")) {
      const code = codeByFdc.get(r.fdc_id);
      const m = /^Moisture change: (-?\d+(?:\.\d+)?)%$/.exec(r.value);
      if (code && r.food_attribute_type_id === "1002" && m) {
        extract.fnddsMoisture[code] = { fdcId: Number(r.fdc_id), description: descriptions.get(r.fdc_id) ?? "", moisturePct: Number(m[1]) };
      }
    }
    continue;
  }
  for (const r of table(zip, "food.csv")) {
    if (fdcIds.has(r.fdc_id)) {
      extract.foods[r.fdc_id] = { description: r.description, dataType: r.data_type, kcalNutrient: "1008", kcal: 0, protein: 0, carbs: 0, fat: 0, alcohol: 0 };
    }
  }
  for (const r of table(zip, "food_nutrient.csv")) {
    if (fdcIds.has(r.fdc_id)) nutrients.set(r.fdc_id, { ...nutrients.get(r.fdc_id), [r.nutrient_id]: Number(r.amount) });
  }
}

const missing: string[] = [];
for (const id of fdcIds) {
  const food = extract.foods[id];
  const n = nutrients.get(id) ?? {};
  const energy = ENERGY.find((e) => n[e] !== undefined);
  if (!food || !energy) {
    missing.push(`FDC ${id}`);
    continue;
  }
  food.kcalNutrient = energy;
  food.kcal = n[energy];
  for (const [nid, key] of Object.entries(NUTRIENT)) food[key] = n[nid] ?? 0;
}
for (const code of foodCodes) if (!extract.fnddsMoisture[code]) missing.push(`FNDDS ${code}`);
if (missing.length > 0) throw new Error(`not in the pinned release: ${missing.join(", ")}`);

// Sorted keys and fixed indentation, so the committed extract only changes when the data does.
const sorted = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => Number(a) - Number(b)));
writeFileSync(EXTRACT, `${JSON.stringify({ ...extract, foods: sorted(extract.foods), fnddsMoisture: sorted(extract.fnddsMoisture) }, null, 2)}\n`);
console.log(`extract: ${Object.keys(extract.foods).length} FDC foods, ${Object.keys(extract.fnddsMoisture).length} FNDDS moisture changes`);
