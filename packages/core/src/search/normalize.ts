/*
 * Turkish food search (research.md §8). The database keeps every alias as `normalize_tr(alias)` and
 * `search_foods` normalizes the query the same way; `normalizeTr` is that SQL function in
 * TypeScript (tests/fixtures/normalize-tr.json holds the pairs both are checked against). Suffixes
 * are handled here: the app sends the typed words plus their likely stems ("tavuğu" → "tavuk").
 */

// Same letters, same order as `translate` in public.normalize_tr (20261009000100_schema.sql).
const FOLD_FROM = "İIıÇçĞğÖöŞşÜüÂâÎîÛû";
const FOLD_TO = "iiiccggoossuuaaiiuu";

/**
 * Turkish letters folded to ASCII, then lower-cased, whitespace collapsed and trimmed. Folding
 * comes first so İ/I never reach the locale-dependent lower-casing, exactly as in SQL.
 */
export function normalizeTr(text: string): string {
  let folded = "";
  for (const ch of text) {
    const i = FOLD_FROM.indexOf(ch);
    folded += i >= 0 ? FOLD_TO[i] : ch;
  }
  return folded.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Turkish lower-casing (I → ı, İ → i) without folding, so suffix rules can see ğ, ı and ü. */
function lowerTr(text: string): string {
  return text.replaceAll("I", "ı").replaceAll("İ", "i").toLowerCase();
}

function words(text: string): string[] {
  return lowerTr(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * Noun suffixes that food words carry in a sentence, longest first: plural (+ possessive),
 * genitive, ablative, locative, "with" (-lı) and the possessive/accusative vowel with its
 * buffer letter (çorba-sı, su-yu). The dative (-a/-e) is left out: stripping it from "elma"
 * or "pizza" finds nothing useful.
 */
const SUFFIXES = [
  "ları", "leri",
  "nın", "nin", "nun", "nün", "dan", "den", "tan", "ten", "lar", "ler",
  "lı", "li", "lu", "lü", "yı", "yi", "yu", "yü", "sı", "si", "su", "sü", "ın", "in", "un", "ün", "da", "de", "ta", "te",
  "ı", "i", "u", "ü",
];

/** A stem's final consonant softened before a vowel suffix (tavuk → tavuğu, kitap → kitabı). */
const HARDEN: Record<string, string> = { ğ: "k", b: "p", c: "ç", d: "t" };

/** Clusters left when a suffix drops a vowel (göğüs → göğsü, burun → burnu, isim → ismi). */
const DROP_FIRST = "ğrlnzshym";
const DROP_SECOND = "sznlmr";
const VOWELS = "aeıioöuü";
/** The high vowel that follows a stem's last vowel (two-way vowel harmony). */
const HIGH_VOWEL: Record<string, string> = { a: "ı", ı: "ı", e: "i", i: "i", o: "u", u: "u", ö: "ü", ü: "ü" };

function candidates(stem: string, vowelSuffix: boolean): string[] {
  const last = stem.at(-1) ?? "";
  const out: string[] = [];
  // ğ never ends a Turkish word; b/c/d may, so both spellings are kept.
  if (last !== "ğ") out.push(stem);
  if (!vowelSuffix) return out;
  if (last in HARDEN) out.push(stem.slice(0, -1) + HARDEN[last]);
  const beforeLast = stem.at(-2) ?? "";
  const lastVowel = [...stem].reverse().find((ch) => VOWELS.includes(ch));
  if (lastVowel && DROP_FIRST.includes(beforeLast) && DROP_SECOND.includes(last)) {
    out.push(stem.slice(0, -1) + HIGH_VOWEL[lastVowel] + last);
  }
  return out;
}

/**
 * Likely stems of the words in `text` ("tavuğu" → "tavuk", "göğsü" → "göğüs", "köfteler" →
 * "köfte"), Turkish lower-case, without the words themselves and without duplicates. Candidates
 * may include non-words; the database only keeps the ones that match an alias.
 */
export function searchStems(text: string): string[] {
  const typed = words(text);
  const found = new Set<string>();
  for (const word of typed) {
    if (word.length < 3) continue;
    for (const suffix of SUFFIXES) {
      if (!word.endsWith(suffix) || word.length - suffix.length < 2) continue;
      for (const stem of candidates(word.slice(0, -suffix.length), VOWELS.includes(suffix[0]))) {
        if (stem.length >= 2) found.add(stem);
      }
    }
  }
  for (const word of typed) found.delete(word);
  return [...found];
}

/** The longest `q` that search_foods accepts. */
export const SEARCH_QUERY_MAX = 60;

/**
 * The `q` for search_foods: the typed words, then their stems, cut at a word so it stays within
 * SEARCH_QUERY_MAX. Empty when nothing searchable was typed.
 */
export function searchQuery(text: string): string {
  const parts = [...new Set([...words(text), ...searchStems(text)])];
  let q = "";
  for (const part of parts) {
    const next = q ? `${q} ${part}` : part;
    if (next.length > SEARCH_QUERY_MAX) break;
    q = next;
  }
  return q;
}
