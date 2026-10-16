/*
 * The on-device text preview (003 FR-007, research.md §5): a typed meal ("2 yumurta, yarım simit
 * ve şekersiz çay") split into phrases, each with its amount, unit and the words to search for.
 * Rule-based, no model and no I/O; the app searches each `query` with the food search and turns
 * the amount into grams with the hit's portions. Unit labels come from the food list, so this
 * module does not know the foods.
 */

export interface ParsedPhrase {
  /** The user's words for this food, trimmed. */
  phrase: string;
  /** What to search for: the phrase without amount, unit and negation words, Turkish lower case. */
  query: string;
  /** How many units (or grams); null when no amount was written. */
  amount: number | null;
  /** The portion unit label as the food list writes it; null for grams or no unit. */
  unit: string | null;
  unitKind: "gram" | "portion" | null;
  /** Words with a negation suffix ("şekersiz"), to prefer foods whose name carries them. */
  negated: string[];
}

const ONES: Record<string, number> = { bir: 1, iki: 2, "üç": 3, "dört": 4, "beş": 5, "altı": 6, yedi: 7, sekiz: 8, dokuz: 9 };
const TENS: Record<string, number> = { on: 10, yirmi: 20, otuz: 30, "kırk": 40, elli: 50, "altmış": 60, "yetmiş": 70, seksen: 80, doksan: 90 };
const FRACTIONS: Record<string, number> = { "yarım": 0.5, "çeyrek": 0.25 };
const GRAM_WORDS: Record<string, number> = { g: 1, gr: 1, gram: 1, kg: 1000, kilo: 1000 };
/** Everyday words for units the food list names differently. */
const UNIT_SYNONYMS: Record<string, string> = { tane: "adet", "kaşık": "yemek kaşığı", "kaşığı": "yemek kaşığı" };
const NEGATION = /(sız|siz|suz|süz)$/;
// A comma splits phrases unless a digit follows it: "1,5 kase" is one and a half.
const SPLIT = /[;\n+]|,(?!\d)|\s(?:ve|ile)\s/iu;

/** Turkish lower case: I → ı and İ → i before the locale-free lower-casing. */
const lowerTr = (text: string) => text.replaceAll("I", "ı").replaceAll("İ", "i").toLowerCase();

/** A unit label with a suffix still matches: dilimi → dilim, kasesi → kase, tabağı → tabak, avucu → avuç. */
function sameUnitWord(token: string, unit: string): boolean {
  if (token === unit) return true;
  const stems = [unit, unit.replace(/k$/, "ğ"), unit.replace(/ç$/, "c")];
  return stems.some((stem) => token.startsWith(stem) && token.length - stem.length <= 3);
}

interface Amount {
  value: number;
  next: number;
  /** A gram unit written onto the number ("200g"). */
  gramFactor: number | null;
}

/** Reads an amount at `i`: digits ("1,5", "200g") or number words ("iki yüz elli", "bir buçuk", "yarım"). */
function readAmount(tokens: string[], i: number): Amount | null {
  const digits = /^(\d+(?:[.,]\d+)?)(kg|gr|gram|g)?$/.exec(tokens[i]);
  if (digits) {
    let value = Number(digits[1].replace(",", "."));
    let next = i + 1;
    if (tokens[next] === "buçuk") {
      value += 0.5;
      next++;
    }
    return { value, next, gramFactor: digits[2] ? GRAM_WORDS[digits[2]] : null };
  }
  if (tokens[i] in FRACTIONS) return { value: FRACTIONS[tokens[i]], next: i + 1, gramFactor: null };

  let total = 0;
  let current = 0;
  let j = i;
  for (; j < tokens.length; j++) {
    const t = tokens[j];
    if (t in ONES) current += ONES[t];
    else if (t in TENS) current += TENS[t];
    else if (t === "yüz") current = (current || 1) * 100;
    else if (t === "bin") {
      total += (current || 1) * 1000;
      current = 0;
    } else break;
  }
  if (j === i) return null;
  let value = total + current;
  if (tokens[j] === "buçuk") {
    value += 0.5;
    j++;
  }
  return { value, next: j, gramFactor: null };
}

/** A unit at `i`: grams, a (one- or two-word) portion label or a synonym of one. */
function readUnit(tokens: string[], i: number, units: string[]): { unit: string | null; gramFactor: number | null; next: number } | null {
  const t = tokens[i];
  if (t === undefined) return null;
  if (t in GRAM_WORDS) return { unit: null, gramFactor: GRAM_WORDS[t], next: i + 1 };
  const multi = units.filter((u) => u.includes(" ")).sort((a, b) => b.length - a.length);
  for (const unit of multi) {
    const words = unit.split(" ");
    if (words.every((w, k) => (k === words.length - 1 ? sameUnitWord(tokens[i + k] ?? "", w) : tokens[i + k] === w))) {
      return { unit, gramFactor: null, next: i + words.length };
    }
  }
  const single = units.find((u) => !u.includes(" ") && sameUnitWord(t, u));
  if (single) return { unit: single, gramFactor: null, next: i + 1 };
  if (t in UNIT_SYNONYMS) return { unit: UNIT_SYNONYMS[t], gramFactor: null, next: i + 1 };
  return null;
}

function parsePhrase(phrase: string, units: string[]): ParsedPhrase | null {
  const tokens = lowerTr(phrase).split(/\s+/).filter(Boolean);
  let amount: number | null = null;
  let unit: string | null = null;
  let unitKind: ParsedPhrase["unitKind"] = null;
  const words: string[] = [];
  const negated: string[] = [];

  for (let i = 0; i < tokens.length; ) {
    const read: Amount | null = amount === null ? readAmount(tokens, i) : null;
    if (read) {
      i = read.next;
      if (read.gramFactor !== null) {
        amount = read.value * read.gramFactor;
        unitKind = "gram";
        continue;
      }
      amount = read.value;
      const u = readUnit(tokens, i, units);
      if (u) {
        i = u.next;
        if (u.gramFactor !== null) {
          amount = read.value * u.gramFactor;
          unitKind = "gram";
        } else {
          unit = u.unit;
          unitKind = "portion";
        }
      }
      continue;
    }
    const t = tokens[i++];
    if (t.length > 4 && NEGATION.test(t)) negated.push(t);
    else words.push(t);
  }

  const query = words.join(" ");
  if (!query) return null;
  return { phrase, query, amount: amount === null ? null : Math.round(amount * 1000) / 1000, unit, unitKind, negated };
}

/** Every food phrase of a typed meal, in order; phrases with nothing to search for are left out. */
export function parseMeal(text: string, units: readonly string[]): ParsedPhrase[] {
  const labels = units.map(lowerTr);
  return text
    .split(SPLIT)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => parsePhrase(p, labels) ?? []);
}
