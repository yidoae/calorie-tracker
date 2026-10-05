import { categoryFromMacros } from "@/lib/nutrition/foods";
import { foodProductSchema, type FoodProduct } from "@/types/food";
import type { Micros } from "@/types/nutrition";
import { z } from "@/types/zod";
import { db } from "../db";

/*
 * Barcode lookups against Open Food Facts (open data, ODbL). Only the barcode leaves the server:
 * no user data, no locale. Answers are normalised to our food shape, validated, and cached in the
 * FoodProduct table so repeat scans don't hit the network.
 */

const OFF_URL = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "product_name,product_name_tr,brands,nutriments,serving_quantity";
const USER_AGENT = "KaloriTakip/0.1 (self-hosted calorie tracker)";
const TIMEOUT_MS = 8000;
const CACHE_DAYS = 30;
/** Unknown barcodes are retried sooner: someone may add the product to OFF. */
const MISS_CACHE_DAYS = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

export class FoodLookupError extends Error {
  constructor() {
    super("Ürün veritabanına ulaşılamadı. Biraz sonra tekrar dene.");
    this.name = "FoodLookupError";
  }
}

const num = z.union([z.number(), z.string()]).optional().transform((v) => {
  const n = typeof v === "string" ? Number.parseFloat(v.replace(",", ".")) : v;
  return n !== undefined && Number.isFinite(n) && n >= 0 ? n : undefined;
});

/** Just the parts of an OFF answer we read; everything else is ignored. */
const offResponseSchema = z.object({
  status: z.number(),
  product: z
    .object({
      product_name: z.string().optional(),
      product_name_tr: z.string().optional(),
      brands: z.string().optional(),
      serving_quantity: num,
      nutriments: z
        .object({
          "energy-kcal_100g": num,
          energy_100g: num,
          proteins_100g: num,
          carbohydrates_100g: num,
          fat_100g: num,
          fiber_100g: num,
          sugars_100g: num,
          "saturated-fat_100g": num,
          sodium_100g: num,
        })
        .optional(),
    })
    .optional(),
});

const round1 = (n: number) => Math.round(n * 10) / 10;

/** OFF answer → our product, or null if it lacks the basics (name and energy). */
function normalise(barcode: string, raw: unknown): FoodProduct | null {
  const parsed = offResponseSchema.safeParse(raw);
  if (!parsed.success || parsed.data.status !== 1 || !parsed.data.product) return null;
  const p = parsed.data.product;
  const n: Partial<NonNullable<typeof p.nutriments>> = p.nutriments ?? {};
  const kcal = n["energy-kcal_100g"] ?? (n.energy_100g !== undefined ? n.energy_100g / 4.184 : undefined);
  const name = (p.product_name_tr || p.product_name || "").trim().slice(0, 80);
  if (!name || kcal === undefined) return null;

  const per100g = { calories: Math.round(kcal), protein: round1(n.proteins_100g ?? 0), carbs: round1(n.carbohydrates_100g ?? 0), fat: round1(n.fat_100g ?? 0) };
  const micros: Micros = {};
  if (n.fiber_100g !== undefined) micros.fiber = round1(n.fiber_100g);
  if (n.sugars_100g !== undefined) micros.sugar = round1(n.sugars_100g);
  if (n["saturated-fat_100g"] !== undefined) micros.satFat = round1(n["saturated-fat_100g"]);
  if (n.sodium_100g !== undefined) micros.sodium = Math.round(n.sodium_100g * 1000); // g → mg

  const product = foodProductSchema.safeParse({
    barcode,
    name,
    brand: p.brands?.split(",")[0]?.trim().slice(0, 80) || null,
    category: categoryFromMacros(per100g),
    per100g,
    micros,
    servingGrams: p.serving_quantity && p.serving_quantity <= 2000 ? p.serving_quantity : null,
  });
  return product.success ? product.data : null;
}

async function fetchFromOff(barcode: string): Promise<FoodProduct | null> {
  let res: Response;
  try {
    res = await fetch(`${OFF_URL}/${barcode}.json?fields=${FIELDS}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new FoodLookupError();
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new FoodLookupError();
  return normalise(barcode, await res.json().catch(() => null));
}

/** The product for a barcode, or null if Open Food Facts doesn't know it. Throws FoodLookupError when OFF is down. */
export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const cached = await db.foodProduct.findUnique({ where: { barcode } });
  if (cached) {
    const age = Date.now() - cached.fetchedAt.getTime();
    const fresh = age < (cached.data ? CACHE_DAYS : MISS_CACHE_DAYS) * DAY_MS;
    if (fresh) {
      if (!cached.data) return null;
      try {
        const product = foodProductSchema.safeParse(JSON.parse(cached.data));
        if (product.success) return product.data;
      } catch {
        // corrupt cache row: refetch below
      }
    }
  }

  const product = await fetchFromOff(barcode);
  const data = product ? JSON.stringify(product) : null;
  await db.foodProduct.upsert({ where: { barcode }, create: { barcode, data }, update: { data, fetchedAt: new Date() } });
  return product;
}
