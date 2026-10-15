# Data Model: Food Database (part A)

Changes to the 001 schema ([001 data-model](../001-mobile-foundation/data-model.md)) plus the
pipeline's source records. Database objects follow the 001 rules: RLS on every table, the API roles
read the food tables and never write them, migrations are the only writers.

## Database

### Enum-like checks

`foods.category` (replaces the 8-value 001 check; the app does not read the column today):

`meat`, `poultry`, `fish`, `egg`, `dairy`, `legume`, `grain`, `bread`, `vegetable`, `fruit`,
`nut_seed`, `oil`, `sweet`, `drink`, `alcohol`, `dish`

`foods.source_kind`: `usda`, `recipe`, `label`

### foods (changed)

| Column | Type | Rule | Change |
|---|---|---|---|
| id | text PK | `^[a-z0-9_]{1,64}$`; the 79 ids of 001 are kept (FR-006) | — |
| name_tr | text | 1–80 chars; no brand names (FR-004b, checked by the build) | — |
| category | text | one of the list above | check replaced |
| kcal_per_100g | numeric(6,2) | 0–900 | — |
| protein_per_100g / carbs_per_100g / fat_per_100g | numeric(6,2) | 0–100 | — |
| alcohol_per_100g | numeric(6,2) not null default 0 | 0–100 | **new** |
| typical_portion_g | numeric(6,1) | > 0 (build also enforces ≤ 5000) | — |
| source_kind | text not null | `usda` / `recipe` / `label` | **new** |
| source_ref | text not null | 1–200 chars: `FDC <id> (<data type>, 2026-04)`, `recipe:<id>`, `label:<product>, <YYYY-MM-DD>` | **new** |
| withdrawn | boolean not null default false | true = hidden from search, still readable in meals (FR-010) | **new** |
| unit_weights | jsonb | — | **dropped** (never read; replaced by `food_portions`) |

The schema migration adds the new category check `not valid` (old rows keep their 001 categories
until the first list migration rewrites them); every generated list migration ends with
`validate constraint`, which is a no-op once all rows comply. `source_kind` and `source_ref` are
added with a temporary default (`'usda'`, `'legacy'`) that the first list migration overwrites and
then drops.

### food_portions (new)

| Column | Type | Rule |
|---|---|---|
| food_id | text FK → foods(id) on delete cascade | — |
| unit | text | Turkish unit label, 1–30 chars: "adet", "dilim", "su bardağı", "yemek kaşığı", "porsiyon", … |
| grams | numeric(6,1) | > 0 and ≤ 5000 (FR-007) |
| position | smallint | ≥ 0; chip order |

PK `(food_id, unit)`. RLS enabled; policy "food portions: read" for `authenticated` using `true`;
`grant select` to `authenticated`; no insert/update/delete grants.

### food_aliases (unchanged)

Alias uniqueness across foods (spec edge case) is enforced by the build on the normalised text, not
by a database constraint: two foods may legitimately share a raw string before a release fixes it,
and a failed migration would block the whole release instead of naming the pair.

### meal_items, meals (unchanged)

Items keep snapshotting kcal/P/C/F per 100 g on insert (`meal_items_prepare`), so a list release
never changes a saved meal (FR-014, SC-007). Alcohol energy is already inside kcal.

## Pipeline sources (`tools/fooddata/sources/`)

Typed TypeScript modules, parsed through Zod schemas on load.

| Record | Fields | Rules |
|---|---|---|
| **UsdaFood** (`foods/*.ts`) | id, name, category, fdcId, aliases[], typicalPortionG, portions? | fdcId present in the extract |
| **LabelFood** (`labels.ts`) | id, name, category, label {product, date, kcal, protein, carbs, fat, alcohol?}, aliases[], typicalPortionG, portions? | values per 100 g as printed; product name may contain a brand, `name` and aliases may not |
| **Recipe** (`recipes/*.ts`) | id, name, category `dish`, ingredients[{foodId, grams}], waterG, yield: `{kind: "weighed", grams, date}` \| `{kind: "fndds", foodCode, moisturePct}` \| `{kind: "usda_meat_yield", table, yieldPct}`, aliases[], typicalPortionG, portions? | ingredients are `UsdaFood` ids; cooked weight > 0 and ≤ Σ grams + water |
| **Withdrawn** (`withdrawn.ts`) | id, reason | id exists in the database (an earlier list) |
| **SearchCase** (`search-cases.ts`) | query, expectedId | ≥ 100 cases; expectedId in the list |
| **UsdaExtract** (`usda/extract.json`) | fdcId → {description, dataType, kcal, kcalNutrient, protein, carbs, fat, alcohol} | written by `fetch` only |
| **UsdaRelease** (`usda/release.json`) | release label, files[{name, url, sha256}] | written once per pinned release |

Portions in sources: `[{unit: "adet", grams: 50}, …]`, order = chip order.

## Build rules (fail with the food's id and the rule)

1. Ids unique across all source files; `^[a-z0-9_]{1,64}$`; the 79 001 ids all present (FR-006).
2. Name ≤ 80 chars; no brand: the name and aliases must not contain any word of the label's
   product name that is not in the food's own name.
3. Every normalised alias (core `normalizeTr`) unique across foods; ≥ 1 alias per food.
4. Per-100 g values within the column ranges; energy within ±15 % of 4P + 4C + 9F + 7A
   (foods under 20 kcal are exempt: rounding dominates).
5. Typical portion and unit portions > 0 and ≤ 5000 g; units unique per food.
6. Recipes: ingredients exist and are `usda` foods; cooked weight rule above.
7. Bare staple names (owner rule 2026-10-11, FR-005): a food whose name has a state marker
   ("(pişmiş)", "(haşlanmış)", "(kızarmış)", "(ızgara)") must not own the bare alias of its staple.
8. Counts: ≥ 450 foods and ≥ 80 `dish` foods (SC-001), reported, failing below.

## State transitions

`food`: absent → listed (first list that contains it) → withdrawn (`withdrawn = true` when it leaves
the sources and is listed in `withdrawn.ts`) → listed again (if it returns). Never deleted.
