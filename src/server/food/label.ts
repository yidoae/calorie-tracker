import path from "node:path";
import sharp from "sharp";
import { createWorker, type Worker } from "tesseract.js";
import { EMPTY_LABEL, LABEL_FIELDS, checkLabel, parseNutritionLabel, type LabelValues } from "@/lib/nutrition/labelParse";
import type { LabelRead } from "@/types/food";
import { z } from "@/types/zod";
import { VISION_MODEL } from "../llm/config";
import { ollamaChat, parseJsonAnswer } from "../llm/ollama";

/*
 * Reads the nutrition table on a pack photo. Two readers, best first:
 *  1. a local Ollama vision model (LOCAL_VISION_MODEL), constrained to a JSON schema;
 *  2. Tesseract OCR (Turkish + English) on a cleaned-up image, then `parseNutritionLabel`.
 * Fields the vision model misses are filled from OCR. Nothing is guessed: unreadable fields stay
 * null and the user fills them in before saving.
 */

export class LabelReadError extends Error {
  constructor() {
    super("Etiketteki değerler okunamadı. Tabloyu yakından, düz ve net çekip tekrar dene ya da değerleri elle gir.");
    this.name = "LabelReadError";
  }
}

const OCR_LANGS = ["tur", "eng"];
/** Trained data is downloaded once and kept here (ignored by git). */
const OCR_CACHE = path.join(process.cwd(), ".cache", "tesseract");
const OCR_TIMEOUT_MS = 60_000;
const VISION_TIMEOUT_MS = 90_000;

let workerPromise: Promise<Worker> | null = null;

/** One OCR worker per server process (loading the language data takes seconds). */
function ocrWorker(): Promise<Worker> {
  workerPromise ??= createWorker(OCR_LANGS, 1, { cachePath: OCR_CACHE }).catch((err: unknown) => {
    workerPromise = null;
    throw err;
  });
  return workerPromise;
}

/**
 * Long edges for the OCR passes. Below ~2000 px Tesseract starts merging "7,4g" into "7449"; a
 * second, larger pass fills whatever the first one missed.
 */
const OCR_EDGES = [2200, 3000];

/** Upright, grey, contrast-stretched and scaled so the long edge is `edge` px (small print on packs). */
async function cleanForOcr(image: Buffer, edge: number): Promise<Buffer> {
  return sharp(image)
    .rotate()
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

async function readWithOcr(image: Buffer): Promise<LabelValues | null> {
  try {
    const worker = await ocrWorker();
    let values: LabelValues | null = null;
    for (const edge of OCR_EDGES) {
      const { data } = await withTimeout(worker.recognize(await cleanForOcr(image, edge)), OCR_TIMEOUT_MS);
      const pass = parseNutritionLabel(data.text);
      values = values ? fillMissing(values, pass) : pass;
      if (found(values) === LABEL_FIELDS.length) break;
    }
    return values;
  } catch (err) {
    console.warn("Label OCR failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

const nullableNumber = { type: ["number", "null"] } as const;
const VISION_FORMAT = {
  type: "object",
  properties: {
    name: { type: ["string", "null"] },
    ...Object.fromEntries([...LABEL_FIELDS, "servingGrams"].map((k) => [k, nullableNumber])),
  },
  required: ["name", ...LABEL_FIELDS, "servingGrams"],
};

const visionAnswerSchema = z.object({
  name: z.string().nullable().catch(null),
  calories: z.number().nullable().catch(null),
  protein: z.number().nullable().catch(null),
  carbs: z.number().nullable().catch(null),
  fat: z.number().nullable().catch(null),
  fiber: z.number().nullable().catch(null),
  sugar: z.number().nullable().catch(null),
  satFat: z.number().nullable().catch(null),
  sodium: z.number().nullable().catch(null),
  servingGrams: z.number().nullable().catch(null),
});

const VISION_PROMPT = `Read the nutrition facts table on this food package.
Return the values PER 100 g (the "100 g" column), not per serving.
calories = kcal (if only kJ is printed, divide by 4.184). protein, carbs, fat, fiber, sugar, satFat in grams.
sodium in milligrams; if only salt (tuz) is printed, sodium = salt in grams * 400.
servingGrams = grams in one serving/portion if printed, else null. name = product name if visible, else null.
Use null for anything you cannot read. Never guess.`;

async function readWithVision(model: string, image: Buffer): Promise<{ values: LabelValues; name: string | null } | null> {
  const jpeg = await sharp(image).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  const answer = await ollamaChat({
    model,
    system: "You read food package labels exactly. Output JSON only.",
    user: VISION_PROMPT,
    images: [jpeg.toString("base64")],
    format: VISION_FORMAT,
    maxTokens: 300,
    timeoutMs: VISION_TIMEOUT_MS,
  });
  const parsed = visionAnswerSchema.safeParse(parseJsonAnswer(answer));
  if (!parsed.success) return null;
  const { name, ...values } = parsed.data;
  // Same plausibility checks as the OCR path: one mangled cell shouldn't poison the form.
  return { values: checkLabel(values), name: name?.trim().slice(0, 80) || null };
}

function found(v: LabelValues): number {
  return LABEL_FIELDS.filter((k) => v[k] !== null).length;
}

/** `base` with its empty fields taken from `extra`. */
function fillMissing(base: LabelValues, extra: LabelValues): LabelValues {
  const out = { ...base };
  for (const key of [...LABEL_FIELDS, "servingGrams"] as const) out[key] ??= extra[key];
  return out;
}

/** Reads a label photo. Throws LabelReadError when neither reader found the energy or a macro. */
export async function readNutritionLabel(image: Buffer): Promise<LabelRead> {
  const vision = VISION_MODEL ? await readWithVision(VISION_MODEL, image) : null;
  const visionComplete = vision && found(vision.values) === LABEL_FIELDS.length;
  const ocr = visionComplete ? null : await readWithOcr(image);

  let values: LabelValues = { ...EMPTY_LABEL };
  if (vision) values = ocr ? fillMissing(vision.values, ocr) : vision.values;
  else if (ocr) values = ocr;

  if (values.calories === null && values.protein === null && values.carbs === null && values.fat === null) throw new LabelReadError();
  return { values, name: vision?.name ?? null, method: vision && found(vision.values) > 0 ? "vision" : "ocr" };
}
