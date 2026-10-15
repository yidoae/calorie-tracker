# Data Model: Food Database (part A)

Changes to the 001 schema ([001 data-model](../001-mobile-foundation/data-model.md)) plus the
pipeline's source records. Database objects follow the 001 rules: RLS on every table, the API roles
read the food tables and never write them, migrations are the only writers.

## Database

### Enum-like checks

`foods.category` (replaces the 8-value 001 check; the app does not read the column today):

`meat`, `poultry`, `fish`, `egg`, `dairy`, `legume`, `grain`, `bread`, `vegetable`, `fruit`,
`nut_seed`, `oil`, `sweet`, `drink`, `alcohol`, `dish`, `other` (salt, yeast, protein powder: used by
release 1)

`foods.source_kind`: `usda`, `recipe`, `label`

The dev project already holds two 002 migrations made outside this plan on 2026-10-14
(`20261014000100_food_sources`, `20261014000200_food_release_1`: 118 foods, 322 aliases; research
§10). They are committed verbatim and `20261015000100_food_schema` builds on them.

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
| source_kind | text not null | `usda` / `recipe` / `label` | added by `food_sources` (nullable); made required with a check |
| source_ref | text not null | 1–200 chars: `fdc:<id>`, `recipe:<id>`, `label:<…>` (release 1 format) | added by `food_sources`; made required |
| searchable | boolean not null default true | false = withdrawn: hidden from search, still readable in meals (FR-010) | from `food_sources` |
| unit_weights | jsonb | — | **dropped**, its entries moved to `food_portions` with Turkish unit labels |

`food_sources` dropped the 001 category check and release 1 recategorised every food, so the new
check is added validated.

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
| **LabelFood** (`labels.ts`) | id, name, category, label {brand, product, date, kcal, protein, carbs, fat, alcohol?}, aliases[], typicalPortionG, portions? | values per 100 g as printed; the brand stays in the source reference, `name` and aliases must not contain its words |
| **Recipe** (`recipes/*.ts`) | id, name, category (usually `dish`; ayran, baklava, simit are recipes too), ingredients[{foodId, grams}], waterG, yield: `{kind: "weighed", grams, date}` \| `{kind: "fndds", foodCode}` (moisture change read from the extract) \| `{kind: "usda_meat_yield", table, yieldPct}`, aliases[], typicalPortionG, portions? | ingredients are USDA or label foods, never another recipe; cooked weight > 0 and ≤ Σ grams + water |
| **Withdrawn** (`withdrawn.ts`) | id, reason | id exists in the database (an earlier list) |
| **SearchCase** (`search-cases.ts`) | query, expectedId | ≥ 100 cases; expectedId in the list |
| **UsdaExtract** (`usda/extract.json`) | foods: fdcId → {description, dataType, kcal, kcalNutrient, protein, carbs, fat, alcohol}; fnddsMoisture: food code → {fdcId, description, moisturePct} | written by `fetch` only |
| **UsdaRelease** (`usda/release.json`) | release label, files[{name, url, sha256}] | written once per pinned release |

Portions in sources: `[{unit: "adet", grams: 50}, …]`, order = chip order.

## Build rules (fail with the food's id and the rule)

1. Ids unique across all source files; `^[a-z0-9_]{1,64}$`; the 79 001 ids all present (FR-006).
2. Name ≤ 80 chars; no brand: the name and aliases of a label food must not contain a word of its
   `label.brand`.
3. Every normalised alias (core `normalizeTr`) unique across foods; ≥ 1 alias per food.
4. Per-100 g values within the column ranges; energy within ±20 % (at least ±10 kcal) of 4P + 4C + 9F + 7A
   (foods under 20 kcal are exempt: rounding dominates).
5. Typical portion and unit portions > 0 and ≤ 5000 g; units unique per food.
6. Recipes: ingredients exist and are USDA or label foods (not recipes); cooked weight rule above.
7. Bare staple names (owner rule 2026-10-11, FR-005): a food whose name has a state marker
   ("(pişmiş)", "(haşlanmış)", "(kızarmış)", "(ızgara)") must not own the bare alias of its staple.
8. Counts: ≥ 450 foods and ≥ 80 `dish` foods (SC-001), reported, failing below.

## State transitions

`food`: absent → listed (first list that contains it) → withdrawn (`searchable = false` when it leaves
the sources and is listed in `withdrawn.ts`) → listed again (if it returns). Never deleted.
