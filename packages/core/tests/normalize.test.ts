import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { normalizeTr, SEARCH_QUERY_MAX, searchQuery, searchStems } from "../src/search/normalize.ts";

/** (input, expected) pairs; supabase/tests/database/search.test.sql checks SQL normalize_tr against the same list. */
const PAIRS = JSON.parse(readFileSync(new URL("./fixtures/normalize-tr.json", import.meta.url), "utf8")) as [string, string][];
const SEARCH_TEST_SQL = new URL("../../../supabase/tests/database/search.test.sql", import.meta.url);

/** A pair as the SQL test writes it: E'…' with escapes when the text has control or no-break characters. */
function sqlLiteral(s: string): string {
  const special = /[\t\n\r\u00a0\u2000-\u200b]/;
  if (!special.test(s)) return `'${s.replaceAll("'", "''")}'`;
  const escaped = [...s]
    .map((ch) => {
      if (ch === "\\") return "\\\\";
      if (ch === "'") return "\\'";
      if (ch === "\t") return "\\t";
      if (ch === "\n") return "\\n";
      if (ch === "\r") return "\\r";
      if (special.test(ch)) return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
      return ch;
    })
    .join("");
  return `E'${escaped}'`;
}

describe("normalizeTr", () => {
  it("folds Turkish letters, lower-cases and collapses spaces like SQL normalize_tr", () => {
    assert.ok(PAIRS.length >= 10);
    for (const [input, expected] of PAIRS) assert.equal(normalizeTr(input), expected, JSON.stringify(input));
  });

  it("folds dotted and dotless I the Turkish way, independent of the runtime locale", () => {
    assert.equal(normalizeTr("IİıiÇĞÖŞÜçğöşü"), "iiiicgosucgosu");
  });

  it("is checked against SQL normalize_tr on every fixture pair (the SQL test lists them all)", () => {
    const sql = readFileSync(SEARCH_TEST_SQL, "utf8");
    const missing = PAIRS.filter(([input, expected]) => !sql.includes(`(${sqlLiteral(input)}, ${sqlLiteral(expected)})`));
    assert.deepEqual(missing, [], "add these pairs to the parity check in search.test.sql");
  });
});

describe("searchStems", () => {
  it("finds the noun under a case or possessive suffix, restoring a softened consonant", () => {
    assert.ok(searchStems("tavuğu").includes("tavuk"));
    assert.ok(searchStems("ekmeği").includes("ekmek"));
    assert.ok(searchStems("Kitabı").includes("kitap"));
  });

  it("restores a dropped vowel (göğsü → göğüs) and strips -lı, -lar, -ları", () => {
    assert.ok(searchStems("göğsü").includes("göğüs"));
    assert.ok(searchStems("tavuklu").includes("tavuk"));
    assert.ok(searchStems("köfteler").includes("köfte"));
    assert.ok(searchStems("yumurtaları").includes("yumurta"));
  });

  it("handles every word of a phrase and keeps buffer letters out (çorbası → çorba, suyu → su)", () => {
    const stems = searchStems("mercimek çorbası, portakal suyu");
    assert.ok(stems.includes("çorba"));
    assert.ok(stems.includes("su"));
  });

  it("returns only new candidates: no input words, no duplicates, nothing shorter than two letters", () => {
    const stems = searchStems("tavuk tavuğu tavuğu");
    assert.ok(!stems.includes("tavuk"));
    assert.equal(new Set(stems).size, stems.length);
    assert.ok(stems.every((s) => s.length >= 2));
    assert.deepEqual(searchStems("et"), []);
    assert.deepEqual(searchStems(""), []);
  });
});

describe("searchQuery", () => {
  it("is the typed text followed by its stems, as search_foods takes it", () => {
    assert.equal(searchQuery("  Tavuğu "), "tavuğu tavuk");
    assert.equal(searchQuery("tavuk göğsü").startsWith("tavuk göğsü "), true);
  });

  it("stays within the 60 characters search_foods accepts, cutting at a word", () => {
    const q = searchQuery("tavuklu pilav ekmeği yoğurdu çorbası köfteleri patatesli salatası");
    assert.ok(q.length <= SEARCH_QUERY_MAX);
    assert.ok(!q.endsWith(" "));
    assert.ok(q.startsWith("tavuklu pilav"));
  });

  it("is empty for blank text", () => {
    assert.equal(searchQuery("   "), "");
  });
});
