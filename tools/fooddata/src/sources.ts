/*
 * Loads every source file under sources/ through its Zod schema. Food and recipe files are split by
 * group (sources/foods/*.ts, sources/recipes/*.ts) and each default-exports an array; a file that
 * does not exist yet counts as empty.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { z } from "@calorie/core/schemas/zod";
import {
  labelFoodSchema,
  recipeSchema,
  searchCaseSchema,
  usdaExtractSchema,
  usdaFoodSchema,
  withdrawnSchema,
  type UsdaExtract,
} from "./schemas.ts";

export const SOURCES = new URL("../sources/", import.meta.url);

async function load<T extends z.ZodType>(file: URL, schema: T): Promise<z.output<T>[]> {
  if (!existsSync(file)) return [];
  const mod = (await import(file.href)) as { default: unknown };
  return z.array(schema).parse(mod.default);
}

async function loadDir<T extends z.ZodType>(dir: string, schema: T): Promise<z.output<T>[]> {
  const url = new URL(`${dir}/`, SOURCES);
  if (!existsSync(url)) return [];
  const files = readdirSync(url).filter((f) => f.endsWith(".ts")).sort();
  const parts = await Promise.all(files.map((f) => load(new URL(f, url), schema)));
  return parts.flat();
}

export async function loadSources() {
  const [usda, labels, recipes, withdrawn, searchCases, legacyIds] = await Promise.all([
    loadDir("foods", usdaFoodSchema),
    load(new URL("labels.ts", SOURCES), labelFoodSchema),
    loadDir("recipes", recipeSchema),
    load(new URL("withdrawn.ts", SOURCES), withdrawnSchema),
    load(new URL("search-cases.ts", SOURCES), searchCaseSchema),
    load(new URL("legacy-ids.ts", SOURCES), z.string()),
  ]);
  return { usda, labels, recipes, withdrawn, searchCases, legacyIds };
}

export const EXTRACT = new URL("usda/extract.json", SOURCES);

export function loadExtract(): UsdaExtract {
  if (!existsSync(EXTRACT)) return { release: "", foods: {}, fnddsMoisture: {} };
  return usdaExtractSchema.parse(JSON.parse(readFileSync(EXTRACT, "utf8")));
}

