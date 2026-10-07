import { KCAL_PER_GRAM, round1 } from "./macros";

/*
 * Reads the nutrition table of a packaged food from OCR text (Turkish or English labels). Pure and
 * deterministic: the server runs it on Tesseract's output, and the same rules check a vision
 * model's answer. Values are per 100 g (the first number column on EU/Turkish labels).
 */

export const LABEL_FIELDS = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "satFat", "sodium"] as const;
export type LabelField = (typeof LABEL_FIELDS)[number];

/** Per-100 g values found on a label (null = not found); sodium in mg, the rest in g / kcal. */
export type LabelValues = Record<LabelField, number | null> & { servingGrams: number | null };

export const EMPTY_LABEL: LabelValues = {
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
  sugar: null,
  satFat: null,
  sodium: null,
  servingGrams: null,
};

/** g of salt -> mg of sodium (EU labels print salt = sodium x 2.5). */
export const SALT_TO_SODIUM_MG = 400;
const KJ_PER_KCAL = 4.184;

/** Lower-cases (Turkish rules) and drops diacritics, so OCR slips like "yag"/"seker" still match. */
export function fold(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const NUMBER = /(<\s*)?(\d+(?:[.,]\d+)?)/g;

/** "12,5" -> 12.5; "<0,5" -> 0 (labels print "<0.5 g" for traces). */
function toNumber(match: RegExpExecArray): number {
  if (match[1]) return 0;
  return Number.parseFloat(match[2].replace(",", "."));
}

/** The first number after `from` in a line, or null. */
function firstNumber(line: string, from = 0): number | null {
  NUMBER.lastIndex = 0;
  const rest = line.slice(from);
  const m = NUMBER.exec(rest);
  return m ? toNumber(m) : null;
}

/** "1.850" (thousands separator before kJ) -> "1850". */
const unthousand = (s: string) => s.replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2");

/** kcal on an energy line: an explicit "kcal" value, else kJ / 4.184, else a lone plausible number. */
function energyFrom(line: string): number | null {
  const l = unthousand(line);
  const kcal = /(\d+(?:[.,]\d+)?)\s*k\s*ca[l1i]/.exec(l);
  if (kcal) return Number.parseFloat(kcal[1].replace(",", "."));
  const kj = /(\d+(?:[.,]\d+)?)\s*k\s*j/.exec(l);
  if (kj) return Number.parseFloat(kj[1].replace(",", ".")) / KJ_PER_KCAL;
  const nums = [...l.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number.parseFloat(m[0].replace(",", ".")));
  // "Enerji 1850 442": kJ then kcal.
  if (nums.length >= 2 && nums[1] > 0 && nums[0] / nums[1] > 3.9 && nums[0] / nums[1] < 4.4) return nums[1];
  return nums.length > 0 && nums[0] <= 900 ? nums[0] : null;
}

type Rule = { field: LabelField | "salt"; test: RegExp; skip?: RegExp };

/**
 * Row classifiers in priority order: the specific rows ("doymuş yağ", "şekerler") must win over
 * the general ones ("yağ", "karbonhidrat") they contain.
 */
const RULES: Rule[] = [
  { field: "satFat", test: /doymus|saturate/, skip: /doymamis|unsaturate/ },
  { field: "sugar", test: /\bseker|\bsugar/, skip: /alkol|polyol|ilave|added/ },
  { field: "fiber", test: /\blif\b|\blifi\b|fib(re|er)|posa/ },
  { field: "protein", test: /prot[ec]in/ },
  { field: "carbs", test: /karbon|carbo/ },
  { field: "salt", test: /\btuz\b|\bsalt\b/ },
  { field: "sodium", test: /sodyum|sodium/ },
  { field: "fat", test: /\byag\b|\byaglar\b|\bfat\b|\bfats\b/, skip: /trans|doymamis|unsaturate|tekli|coklu|mono|poly/ },
];

/** Grams in one serving: "Porsiyon (40 g)", "1 porsiyon = 40 g", "Serving size 40g", "per bar (60g)". */
function servingFrom(text: string): number | null {
  const m = /(porsiyon|serving|per bar|bar basina|1 adet|1 paket|paket basina)[^\d\n]{0,25}(\d+(?:[.,]\d+)?)\s*g\b/.exec(text);
  if (!m) return null;
  const grams = Number.parseFloat(m[2].replace(",", "."));
  return grams > 0 && grams <= 2000 && grams !== 100 ? grams : null;
}

/**
 * Drops values no real per-100 g label can have (OCR misreads like "125" for "12,5") and rounds the
 * rest. Also applied to a vision model's answer.
 */
export function checkLabel(values: LabelValues): LabelValues {
  const out = { ...values };
  if (out.servingGrams !== null && (out.servingGrams <= 0 || out.servingGrams > 2000)) out.servingGrams = null;
  for (const key of ["protein", "carbs", "fat", "fiber", "sugar", "satFat"] as const) {
    const v = out[key];
    if (v !== null && (v < 0 || v > 100)) out[key] = null;
  }
  if (out.calories !== null && (out.calories < 0 || out.calories > 900)) out.calories = null;
  if (out.sodium !== null && (out.sodium < 0 || out.sodium > 40_000)) out.sodium = null;
  if (out.satFat !== null && out.fat !== null && out.satFat > out.fat) out.satFat = null;
  if (out.sugar !== null && out.carbs !== null && out.sugar > out.carbs) out.sugar = null;
  return roundLabel(out);
}

/** Parses a nutrition table from OCR text. Unreadable fields stay null; nothing is guessed. */
export function parseNutritionLabel(text: string): LabelValues {
  const values: LabelValues = { ...EMPTY_LABEL };
  let salt: number | null = null;
  const folded = fold(text);
  const lines = folded.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (values.calories === null && /enerji|energy|kalori|\bkcal\b/.test(line)) {
      const kcal = energyFrom(line);
      if (kcal !== null) values.calories = kcal;
      continue;
    }
    for (const rule of RULES) {
      const hit = rule.test.exec(line);
      if (!hit || rule.skip?.test(line)) continue;
      const n = firstNumber(line, hit.index + hit[0].length);
      if (n !== null) {
        if (rule.field === "salt") salt ??= n;
        else if (rule.field === "sodium") {
          // Sodium is printed in g on EU labels and in mg on US ones.
          const unit = /\d\s*mg/.test(line.slice(hit.index)) ? 1 : 1000;
          values.sodium ??= n * unit;
        } else values[rule.field] ??= n;
      }
      break;
    }
  }

  // The energy row may be split from its label ("Enerji" / "1850 kJ / 442 kcal").
  if (values.calories === null) {
    const kcal = /(\d+(?:[.,]\d+)?)\s*kcal/.exec(unthousand(folded));
    if (kcal) values.calories = Number.parseFloat(kcal[1].replace(",", "."));
  }
  if (values.sodium === null && salt !== null) values.sodium = salt * SALT_TO_SODIUM_MG;
  values.servingGrams = servingFrom(folded);
  return checkLabel(values);
}

function roundLabel(values: LabelValues): LabelValues {
  const out = { ...values };
  for (const key of LABEL_FIELDS) {
    const v = out[key];
    if (v !== null) out[key] = key === "calories" || key === "sodium" ? Math.round(v) : round1(v);
  }
  return out;
}

/** kcal from the macros (Atwater 4/4/9), for when the energy row couldn't be read. */
export function kcalFromMacros(v: Pick<LabelValues, "protein" | "carbs" | "fat">): number | null {
  if (v.protein === null || v.carbs === null || v.fat === null) return null;
  return Math.round(v.protein * KCAL_PER_GRAM.protein + v.carbs * KCAL_PER_GRAM.carbs + v.fat * KCAL_PER_GRAM.fat);
}

/** The four fields a food can't be logged without. */
export const REQUIRED_LABEL_FIELDS = ["calories", "protein", "carbs", "fat"] as const satisfies readonly LabelField[];

export function missingFields(values: LabelValues): LabelField[] {
  return LABEL_FIELDS.filter((key) => values[key] === null);
}
