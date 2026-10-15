# Research: Food Database (part A)

Decisions behind [plan.md](./plan.md), made on 2026-10-15 against the clarified
[spec.md](./spec.md) and the 001 schema (`supabase/migrations/2026100900*`–`2026101100*`).

## 1. USDA data: which release and how it gets into the build

- **Decision**: Pin the FoodData Central (FDC) full download of the April 2026 release (update log
  version 15.0, 2026-04-30): Foundation Foods, SR Legacy and Survey Foods (FNDDS 2021–2023) as CSV.
  A `fetch` step (run by hand, needs the network) downloads the pinned zips, checks their SHA-256
  against `tools/fooddata/sources/usda/release.json`, and writes
  `tools/fooddata/sources/usda/extract.json`: only the FDC ids the sources reference, with energy
  (kcal), protein, total carbohydrate, total fat and alcohol per 100 g, the FDC description and the
  data type. The `build` step reads only the committed extract, so builds are offline and
  reproducible (FR-012, SC-003).
- **Rationale**: The full CSVs are hundreds of MB; committing them is pointless when about 400 ids
  are used. The extract is small, reviewable in a diff, and its provenance (release + hash) is
  recorded. Foundation is preferred when an entry exists; SR Legacy (frozen 2018) fills the rest.
- **Energy nutrient**: Foundation entries can carry Atwater-specific energy (FDC nutrient 2047/2048)
  instead of 1008; the extract takes 1008, else 2048, else 2047, and records which one.
- **Alternatives**: The FDC REST API (needs an API key, rate-limited, values could change between
  calls); committing the full CSVs (size); TürKomp (paid licence for commercial use, owner decision
  2026-10-13).
- **Licence**: FDC data is CC0 1.0 (public domain); USDA asks to be credited as the source, which
  FR-015 does.
- **To confirm at implementation**: the exact zip file names and hashes on the FDC download page
  (the release.json is written then; the log and the homepage disagree on the October schedule).
- Sources: https://fdc.nal.usda.gov/log · https://fdc.nal.usda.gov/api-guide ·
  https://catalog.data.gov/dataset/fooddata-central

## 2. Cooked weights for recipe dishes

- **Decision**: A recipe lists ingredients (food ids from the list, raw grams) and added water. Its
  cooked weight is, in order of preference:
  1. `weighed`: the owner's measurement (grams + date), when present;
  2. `fndds`: (Σ ingredient grams + water) × (1 + moisture change %) of a named FNDDS food code
     (FNDDS "Moisture Adjustment" table, in the Survey Foods download of §1), the closest dish
     (e.g. lentil soup for mercimek çorbası, bean stew for kuru fasulye).
  The chosen yield and its reference are stored on the recipe and shown in the review table
  (FR-004a).
- **Rationale**: Owner's choice (clarify Q5). FNDDS moisture changes are USDA, public domain, and
  cover whole mixed dishes, which ingredient-level yields do not (a stew loses water as a pot, not
  per ingredient). Meat-only dishes (köfte, ızgara) can use the USDA Table of Cooking Yields for
  Meat and Poultry the same way (`usda_meat_yield`), cited by table row.
- **Nutrients**: Values per 100 g of the dish = Σ (ingredient grams × ingredient per-100 g ÷ 100) ÷
  cooked weight × 100. Water adds weight and no nutrients. No nutrient retention factors in part A
  (energy and macros change little in cooking; vitamins are not tracked).
- **Build checks**: cooked weight > 0 and ≤ Σ ingredients + water (spec edge case); every
  ingredient is a food in the list with source kind `usda`.
- **Alternatives**: Bognár (2002) weight yield tables (not public domain); typing a guessed weight
  per dish (no source); weighing every dish (weeks of work, rejected in clarify).
- Sources: https://ars.usda.gov/ARSUserFiles/80400530/pdf/fndds/2021_2023_At_A_Glance.pdf ·
  https://ars.usda.gov/ARSUserFiles/80400535/Data/retn/USDA_CookingYields_MeatPoultry02.pdf

## 3. Where the pipeline lives and what it is written in

- **Decision**: A new workspace `tools/fooddata` (never shipped, like `tools/preview`), TypeScript run
  with `tsx`, importing `@calorie/core` for `normalizeTr` and the shared Zod schemas. Source files are
  TypeScript modules that export typed arrays (`foods/*.ts`, `recipes/*.ts`, `labels.ts`,
  `portions.ts`) and are parsed through Zod on load.
- **Rationale**: No new dependency (no YAML/CSV parser); the same normalisation as the database and
  the app, so alias collisions are found at build time exactly as search would see them; type
  errors in the sources show up in `npm run typecheck`. `tools/*` is already a workspace.
- **Alternatives**: YAML or CSV sources (a parser dependency, no types); a Postgres-only pipeline
  (no way to produce the review page or a deterministic file diff).

## 4. Output: how the list ships

- **Decision**: `npm run build -w fooddata` writes three files, deterministically (stable sort by
  food id, fixed decimal formatting, `\n` line endings, no timestamps):
  1. `supabase/migrations/<version>_food_list_<n>.sql`: a new migration per release that upserts
     foods (`insert … on conflict (id) do update`), replaces the aliases and portions of the listed
     foods, and marks foods that left the list as withdrawn. It never deletes a food (FR-010) and
     never touches `meal_items` (FR-014; items already snapshot their per-100 g values at insert,
     001 trigger `meal_items_prepare`).
  2. `tools/fooddata/out/foods.txt`: the version-controlled summary, one line per food (id, name,
     source, kcal/P/C/F/alcohol, portions), whose git diff is the change log (FR-013).
  3. `tools/fooddata/dist/review.html`: the single-file review page (§6), not committed.
- **Rationale**: The constitution ships database changes as migrations; a migration per release
  keeps the "never edit an applied migration" rule. The text summary gives a readable diff that a
  700-line SQL file does not.
- **Check**: `npm run check -w fooddata` rebuilds into a temp dir and fails if the committed summary
  or the latest migration differs (CI gate for SC-003).

## 5. Search over about 500 foods

- **Decision**: Keep `search_foods` ranking (001 research §8) and add: skip withdrawn foods; return
  the food's unit portions as JSON so the review step needs no second call. Keep the full alias scan.
- **Rationale**: About 500 foods × 4 aliases ≈ 2000 rows; a scan with trigram similarity stays far
  under the 300 ms budget (SC-006). The 001 comment suggested a trigram prefilter "for a large food
  table"; that applies with barcode foods (thousands), not here. Measured in quickstart step 6.
- **Everyday searches**: `tools/fooddata/sources/search-cases.ts` (≥ 100 query → expected food id),
  drafted by the agent, confirmed by the owner. The build generates a pgTAP file
  `supabase/tests/database/search_cases.test.sql` asserting first-place and top-3 results (SC-002),
  run with the other database tests.

## 6. Review page

- **Decision**: One self-contained HTML file (inline CSS and a few lines of vanilla JS; no
  framework, no network), rendered by the build: a table with name, category, source kind +
  reference, kcal/P/C/F/alcohol per 100 g, typical portion, unit portions; a text search box and
  filters for category and source kind; recipe rows expand to their ingredients, water, yield kind
  and cooked weight; foods changed since the last committed summary are marked. Published as a
  claude.ai artifact, like the screen preview.
- **Rationale**: Owner's choice (clarify Q4); 500 rows need search and filters.

## 7. Schema changes

- **Decision** (details in [data-model.md](./data-model.md)):
  - `foods`: add `alcohol_per_100g` (`source_kind`, `source_ref`, `searchable` came with the dev-only migrations of 2026-10-14, see §10); replace the 8-value
    `category` check with the finer list of FR-001 (the column is not read by the app today);
    drop `unit_weights` (never read; replaced by `food_portions`).
  - New `food_portions (food_id, unit, grams, position)`: ordered unit portions with a CHECK on
    grams (0 < g ≤ 5000), readable by signed-in users, written only by migrations.
  - The energy consistency rule (spec edge case: ±20 %, at least ±10 kcal, of 4P + 4C + 9F + 7A; USDA uses food-specific Atwater factors and counts fibre in carbohydrate) lives in the build,
    not as a table CHECK: label sources can legally round, and a CHECK would make a bad label
    unloadable instead of reported by name.
- **Alcohol in meals**: `meal_items` keeps snapshotting kcal/P/C/F only. Alcohol's energy is already
  inside `kcal_per_100g`, so meal totals stay correct; showing alcohol grams is not in the spec.

## 8. Portion shortcuts in the app

- **Decision**: The review step (`DraftItemCard`) shows the food's unit portions as chips plus a
  count stepper (− 1 +). Choosing a chip sets count 1 and writes `grams × 1`; −/+ change the count
  (min 1) and rewrite the field; typing in the field clears the selection (clarify Q1). The rules
  (grams = unit × count, rounding to 0.1 g, the 5000 g cap) are a pure helper next to the hook
  (`portionLogic.ts`, the `*Logic.ts` pattern) with node tests. Foods without unit portions show
  only the existing typical-portion hint (US2 scenario 4).
- **Cap**: a count that would pass 5000 g disables "+".

## 9. Crediting sources

- **Decision**: The profile tab gets a "Veri kaynakları" line: "Besin değerleri: USDA FoodData
  Central (kamu malı, CC0). Türk yemekleri USDA verileriyle tariflerden hesaplanır." (FR-015).
  Label-sourced generic foods are credited by their reference in the review page; no brand appears
  in the app (FR-004b).

## 10. The release already on the dev project (found 2026-10-15)

- **Finding**: Applying T007 stopped at `list_migrations`: the dev project holds
  `20261014000100_food_sources` (adds `source_kind`, `source_ref`, `searchable`; drops the category
  check; caps `typical_portion_g` at 5000) and `20261014000200_food_release_1` (118 foods: 92 USDA,
  24 recipe, 2 label; 322 aliases; generated by a `tools/food-data` workspace). Neither the files nor
  that workspace exist in git or on disk; their SQL was read from
  `supabase_migrations.schema_migrations` and matches by MD5.
- **Decision** (owner, 2026-10-15): keep them. Both files are committed verbatim; the schema
  migration builds on them (`searchable` instead of a `withdrawn` column; `unit_weights` moved to
  `food_portions`); release 1's 118 foods and their FDC ids are the starting data for US1 (T015).
- **Lost**: the 24 recipes' ingredient lists and the label details exist only as their final values;
  T018 rewrites those recipes so the build can recompute them.
