---

description: "Task list for 002 Food Database (part A)"
---

# Tasks: Food Database (part A)

**Input**: Design documents from `/specs/002-food-database/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The constitution (IX) requires them: pipeline rules get `node:test` tests
written before the rule; database changes get pgTAP files written before the migration and seen
failing first; app helpers get node tests.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story from spec.md (US1 find in Turkish, US2 portion shortcuts, US3 trust the numbers)
- Paths: `tools/fooddata/`, `supabase/`, `packages/core/`, `apps/mobile/` per plan.md

## Owner inputs needed during this feature

- Before T023: confirm the everyday search list (`tools/fooddata/sources/search-cases.ts`, ≥ 100 queries).
- At T032: review the food list on the published review page and sign it off in the PR (SC-008).
- Any time: optional weighings of cooked dishes (grams + date) replace the FNDDS yield for that dish.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The `tools/fooddata` workspace and the constitution amendment.

- [ ] T001 Amend `.specify/memory/constitution.md` Product Scope "Food data": "sourced from USDA FoodData Central and Open Food Facts; TürKomp is not used (its commercial use needs a paid licence, owner decision 2026-10-13)"; version 2.0.1 → 2.0.2 (PATCH) with a Sync Impact Report line
- [ ] T002 Create the workspace `tools/fooddata/` (`package.json` name `fooddata`, private, `"type": "module"`, scripts `fetch`, `build`, `check`, `test` = `tsx --test tests/*.test.ts`, `typecheck` = `tsc --noEmit`; dependency `@calorie/core`; strict `tsconfig.json`); add `tools/fooddata` to `knip.json` (entries `src/fetch.ts`, `src/build.ts`, `src/check.ts`, `sources/**/*.ts`, `tests/**/*.test.ts`); `.gitignore` `tools/fooddata/dist/` and the USDA download cache
- [ ] T003 [P] Zod schemas of the source records in `tools/fooddata/src/schemas.ts` per data-model.md "Pipeline sources": `UsdaFood`, `LabelFood`, `Recipe` (yield union `weighed` | `fndds` | `usda_meat_yield`), `Withdrawn`, `SearchCase`, `UsdaExtract`, `UsdaRelease`; category enum exactly `meat, poultry, fish, egg, dairy, legume, grain, bread, vegetable, fruit, nut_seed, oil, sweet, drink, alcohol, dish`; portion `{unit: 1–30 chars, grams: > 0 and ≤ 5000}`

**Checkpoint**: `npm run typecheck -w fooddata`, `npm run knip` pass with an empty source set.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The schema change, the USDA extract and the build skeleton every story needs.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

### Tests

- [ ] T004 [P] pgTAP `supabase/tests/database/food_schema.test.sql` (fail first): `foods` has `alcohol_per_100g` (default 0, check 0–100), `source_kind` (check `usda`/`recipe`/`label`), `source_ref` (1–200 chars), `withdrawn` (default false) and no `unit_weights`; `food_portions` exists with PK `(food_id, unit)`, check `grams > 0 and grams <= 5000`, RLS on, readable by `authenticated`, not writable by `authenticated`, invisible to `anon`; `search_foods` returns a `portions` JSON array ordered by `position` and `[]` without portions; a `withdrawn` food is never returned but stays readable through `meal_items → foods`
- [ ] T005 [P] Rule tests `tools/fooddata/tests/rules.test.ts` (fail first), one per build rule in data-model.md: duplicate id; bad id pattern; missing 001 id; name over 80 chars; brand word in name or alias; duplicate normalised alias across foods (names both ids); no alias; value out of range; energy outside ±15 % of 4P+4C+9F+7A (foods under 20 kcal exempt); portion 0 or over 5000 g; duplicate unit; recipe with a non-`usda` or unknown ingredient; cooked weight > Σ ingredients + water; a state-marked food owning a bare staple alias; under 450 foods or 80 dishes; and that all failures are reported together
- [ ] T006 [P] Recipe tests `tools/fooddata/tests/recipe.test.ts` (fail first): cooked weight from `weighed` beats `fndds`; `fndds` = (Σ g + water) × (1 + moisturePct/100); per-100 g = Σ(g × v/100) / cooked × 100; water adds weight only; rounding half-up after full precision

### Implementation

- [ ] T007 Migration `supabase/migrations/<v>_food_schema.sql` (version after the latest applied): add `alcohol_per_100g numeric(6,2) not null default 0 check (alcohol_per_100g between 0 and 100)`, `source_kind text not null default 'usda' check (source_kind in ('usda','recipe','label'))`, `source_ref text not null default 'legacy' check (char_length(source_ref) between 1 and 200)`, `withdrawn boolean not null default false`; replace the category check with the 16-value list as `not valid`; drop `unit_weights`; create `food_portions` with RLS, policy "food portions: read" and `grant select` to `authenticated`; drop and recreate `private.search_foods` / `public.search_foods` with the `portions` column and `where not f.withdrawn`, re-applying the 001 revoke/grant lines (contracts/database-api.md)
- [ ] T008 Apply T007 to the dev project, regenerate `packages/core/src/db/database.types.ts`, make T004 pass, fix `supabase/tests/database/search.test.sql` and `raw_weights.test.sql` for the new return column, run the security advisor
- [ ] T009 [P] Extend `foodHitRowSchema` in `packages/core/src/schemas/rows.ts` with `portions` (array of `{unit, grams}`, mapped to `portions: {unit: string; grams: number}[]`) and its test in `packages/core/tests/rows.test.ts`; update `tools/preview/src/fakes/foodService.ts` hits with portions
- [ ] T010 `tools/fooddata/src/fetch.ts` and `sources/usda/release.json`: download the pinned FDC April 2026 CSV zips (Foundation, SR Legacy, Survey/FNDDS), verify SHA-256, read `food.csv`, `food_nutrient.csv` and the FNDDS moisture table with Node streams + `zlib`, write `sources/usda/extract.json` with only the referenced FDC ids (energy 1008 → 2048 → 2047, protein 1003, carbs 1005, fat 1004, alcohol 1018) and the FNDDS moisture changes used by recipes; fail naming any missing id (research.md §1–2)
- [ ] T011 `tools/fooddata/src/rules.ts` and `src/recipe.ts`: make T005 and T006 pass; aliases normalised with core `normalizeTr`
- [ ] T012 `tools/fooddata/src/build.ts` skeleton: load every `sources/**` module through the T003 schemas, resolve USDA and recipe values, run the rules, print food and dish counts, exit 1 with all failures

**Checkpoint**: The dev schema has the new columns and `food_portions`; the existing 79 foods still search and log (their `source_ref` is `legacy` until the first list); the build runs on an empty source set.

---

## Phase 3: User Story 1 - Find what I eat in Turkish (Priority: P1) 🎯 MVP

**Goal**: ≥ 450 sourced foods (≥ 80 dishes) in the database, the expected food first for everyday Turkish searches.

**Independent Test**: The generated pgTAP search cases pass: ≥ 95 of 100 first, all 100 in the top 3; "pirinç" finds the raw food first; "sut", "tavuğu", "pilavi" find the same foods as the proper spellings.

### Tests for User Story 1

- [ ] T013 [P] [US1] SQL emitter test `tools/fooddata/tests/sql.test.ts`: the upsert covers every column but `id`, aliases and portions are deleted and reinserted only for listed ids, withdrawn ids get `withdrawn = true`, listed ids `false`, the file ends with `validate constraint foods_category_check`, there is no `delete from foods` and no `meal_items`/`meals`, and two runs give identical text
- [ ] T014 [P] [US1] Search-case emitter test `tools/fooddata/tests/searchCases.test.ts`: one pgTAP check per case for top-3 and a counted check that ≥ 95 % are first (SC-002); stable order

### Implementation for User Story 1

- [ ] T015 [P] [US1] Re-source the 79 foods of 001 with their ids kept (FR-006): staples and raw foods to `tools/fooddata/sources/foods/*.ts` with FDC ids; cooked/prepared forms carry their state in the name ("(pişmiş)", "(haşlanmış)"); kaşar, white bread and simit from FDC or a cited label (FR-006); their former `unit_weights` become `portions`
- [ ] T016 [P] [US1] Raw ingredients by category in `tools/fooddata/sources/foods/{meat,poultry,fish,egg,dairy,legume,grain,bread,vegetable,fruit,nut_seed,oil,sweet,drink,alcohol}.ts`: Turkish names (≤ 80 chars, no brands), ≥ 1 alias each incl. common misspellings and ASCII forms, FDC ids, typical portion and unit portions where natural; alcoholic drinks with alcohol g/100 g (clarify Q3)
- [ ] T017 [P] [US1] Generic label foods in `tools/fooddata/sources/labels.ts` only where no FDC entry fits (e.g. gofret, lokum): product and date in the reference, generic name (FR-004b)
- [ ] T018 [P] [US1] ≥ 80 Turkish dishes in `tools/fooddata/sources/recipes/*.ts` (çorbalar, zeytinyağlılar, etli yemekler, baklagiller, pilavlar, hamur işleri, tatlılar, kahvaltılık): ingredients in raw grams from the list, water, `fndds` yield with the closest FNDDS food code (or `usda_meat_yield` for grilled meats), typical portion and "porsiyon"/"kase" portions
- [ ] T019 [US1] Run `npm run fetch -w fooddata` for every FDC id in T015–T018 and commit `sources/usda/extract.json` and `release.json` with the real file names and hashes
- [ ] T020 [P] [US1] Draft ≥ 100 everyday searches in `tools/fooddata/sources/search-cases.ts` (staples bare and with suffixes, ASCII spellings, dishes, drinks) → expected food id
- [ ] T021 [US1] `tools/fooddata/src/emit/sql.ts` and `emit/searchCases.ts`; `build --release <version>` writes `supabase/migrations/<version>_food_list_1.sql` and `supabase/tests/database/search_cases.test.sql`; make T013, T014 pass
- [ ] T022 [US1] Fix every build failure in the sources until `npm run build -w fooddata` exits 0 with ≥ 450 foods and ≥ 80 dishes (SC-001)
- [ ] T023 [US1] Apply `<version>_food_list_1.sql` to the dev project; run all pgTAP files; tune aliases (never the SQL ranking) until `search_cases.test.sql` passes (SC-002); record the before/after totals of one existing day for SC-007
- [ ] T024 [US1] Add a "Veri kaynakları" section to `apps/mobile/src/app/(tabs)/profile.tsx` with the research.md §9 text (FR-015) and add it to the preview gallery

**Checkpoint**: US1 independently: the dev project searches the new list; old meals show unchanged totals.

---

## Phase 4: User Story 2 - Log with portion shortcuts (Priority: P2)

**Goal**: Unit chips plus a −/+ count stepper on the review step write grams into the field.

**Independent Test**: "Yumurta" → tap "adet" → "+" → the field shows 2 × the unit grams; totals follow; save holds those grams; typing clears the chip.

### Tests for User Story 2

- [ ] T025 [P] [US2] `apps/mobile/tests/portionLogic.test.ts` (fail first): selecting a unit gives count 1 and its grams; "+"/"−" change the count by one, never below 1; grams = unit × count rounded to 0.1 g; "+" disabled when the next count passes 5000 g; typing grams clears the selection; formatted with a Turkish decimal comma like the field

### Implementation for User Story 2

- [ ] T026 [US2] `apps/mobile/src/hooks/portionLogic.ts` (no React Native imports) to make T025 pass; wire selection state into the meal draft in `apps/mobile/src/hooks/useMealDraft.ts`
- [ ] T027 [US2] `apps/mobile/src/components/meals/PortionPicker.tsx`: unit chips in source order and the stepper ("Bir azalt" / "Bir artır" labels, count announced, ≥ 44 pt targets, colours from `theme.ts`, no lime) per contracts/screens.md; render it in `DraftItemCard.tsx` under the gram field when `portions.length > 0`, else keep the typical-portion hint
- [ ] T028 [US2] Preview: add the card with chips and with "adet" at count 2 to `tools/preview/src/PreviewGallery.tsx`; extend `.maestro/smoke.yaml` with a chip tap before saving

**Checkpoint**: US2 works on Expo Go with foods that have portions and without.

---

## Phase 5: User Story 3 - Trust where the numbers come from (Priority: P2)

**Goal**: A reproducible build, a diffable summary and a searchable review page the owner signs off.

**Independent Test**: Two builds give byte-identical output; the review page filters by name, category and source and expands a recipe to its ingredients, water, yield and cooked weight.

### Tests for User Story 3

- [ ] T029 [P] [US3] `tools/fooddata/tests/outputs.test.ts`: `foods.txt` line format per contracts/pipeline.md; two builds byte-identical (SC-003); the review HTML contains every food, the category and source filters, and marks a food whose summary line changed

### Implementation for User Story 3

- [ ] T030 [US3] `tools/fooddata/src/emit/summary.ts` → `tools/fooddata/out/foods.txt` (committed) and `src/emit/review.ts` → `tools/fooddata/dist/review.html` (single file, inline CSS/JS, no network, search box, category and source-kind filters, expandable recipe rows, "değişti" marks against the committed summary); make T029 pass
- [ ] T031 [US3] `tools/fooddata/src/check.ts` (`npm run check -w fooddata`): rebuild into a temp dir, fail if `out/foods.txt`, `search_cases.test.sql` or the latest `*_food_list_*.sql` differ; add the step to `.github/workflows/ci.yml` in the `check` job
- [ ] T032 [US3] Publish `review.html` as a claude.ai artifact for the owner; apply the owner's corrections in the sources (ingredients, names, weighings) and rebuild until sign-off

**Checkpoint**: The owner has signed off the review page (SC-008).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T033 [P] Update `CLAUDE.md` (layout gains `tools/fooddata`; commands `fetch`/`build`/`check`; "Database" notes that food lists ship as generated migrations, never hand-edited) and `README.md` (food data commands, USDA credit)
- [ ] T034 [P] Update `specs/ROADMAP.md`: 002 part A done; parts B (barcode / Open Food Facts) and C (own foods, saved meals) next
- [ ] T035 Measure search latency on a phone over the dev project (SC-006, quickstart step 5.6) and record it in `specs/002-food-database/checklists/validation.md`
- [ ] T036 Run the full [quickstart.md](./quickstart.md) and record results in `specs/002-food-database/checklists/validation.md`; `npm test && npm run typecheck && npm run lint && npm run knip && npm run check -w fooddata` green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup; T007 → T008; T005/T006 → T011 → T012; T010 can run beside T007–T009.
- **US1 (Phase 3)**: after Foundational. T015–T018, T020 in parallel → T019 → T021 → T022 → T023.
- **US2 (Phase 4)**: after Foundational (needs T008/T009 for `portions` in hits); real chips appear once T023 ships foods with portions, but T025–T028 can be built and previewed against the fakes before that.
- **US3 (Phase 5)**: after T012; T030 needs the sources of US1 to be meaningful; T032 needs T023.
- **Polish (Phase 6)**: after the stories.

### Parallel Opportunities

- T003 beside T002 once the folder exists; T004, T005, T006, T009, T010 together.
- US1 data entry: T015, T016 (one file per category), T017, T018 (one file per dish group), T020 all in parallel.
- US2 (app) and US3 (outputs) in parallel after Foundational.

## Parallel Example: User Story 1

```bash
Task: "Raw ingredients: meat and poultry in tools/fooddata/sources/foods/{meat,poultry}.ts"
Task: "Raw ingredients: legumes and grains in tools/fooddata/sources/foods/{legume,grain}.ts"
Task: "Dishes: soups in tools/fooddata/sources/recipes/corbalar.ts"
Task: "Everyday searches in tools/fooddata/sources/search-cases.ts"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Phases 1–2: workspace, schema, extract, build skeleton.
2. Phase 3: the list in the database with search cases green.
3. **Stop and validate**: quickstart steps 1, 4, 5.1, 5.4–5.5.

### Incremental Delivery (small PRs, one concern each)

1. PR 1: T001–T012 (setup + schema + skeleton; no data yet).
2. PR 2: US1 data and the first list migration (T013–T024), with the review page from US3 for sign-off.
3. PR 3: US2 portion shortcuts (T025–T028).
4. PR 4: US3 check gate and polish (T031, T033–T036).
