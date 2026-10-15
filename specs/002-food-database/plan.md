# Implementation Plan: Food Database (part A)

**Branch**: `002-food-database` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-food-database/spec.md`

## Summary

Grow the food list from 79 to at least 450 generic foods (80+ Turkish dishes) with Turkish names,
aliases and unit portions, every value traceable to USDA FoodData Central or a cited label. A new
never-shipped workspace, `tools/fooddata`, builds the list from typed source files and a committed
USDA extract into a generated Supabase migration, a diffable text summary and a searchable HTML
review page; it fails on any data rule. The schema gains alcohol, source and withdrawn columns and a
`food_portions` table; `search_foods` returns portions and hides withdrawn foods. The review step
gets unit chips with a −/+ count stepper; the profile credits USDA. Saved meals never change: items
already snapshot their values.

## Technical Context

**Language/Version**: TypeScript 6 (strict) for the pipeline, core and app; SQL (PostgreSQL 17 on
Supabase) for migrations.

**Primary Dependencies**: no new runtime dependency. Pipeline: `tsx`, `@calorie/core`
(`normalizeTr`, Zod 4 schemas), Node 22 `fetch`/`crypto`/`zlib` for the USDA download. App: the 001
stack. Data: FDC April 2026 release (Foundation, SR Legacy, FNDDS 2021–2023), CC0
([research.md](./research.md) §1–2).

**Storage**: Supabase Postgres: `foods` (changed), `food_portions` (new), `food_aliases`
(unchanged) per [data-model.md](./data-model.md); pipeline sources and outputs in the repository.

**Testing**: `tools/fooddata`: `node:test` for every build rule and the determinism check; core:
the extended `foodHitRowSchema`; app: node tests for `portionLogic.ts`; database: pgTAP for the
schema (RLS on `food_portions`, withdrawn hidden, portions returned) plus the generated
`search_cases.test.sql` (SC-002); Maestro smoke flow extended with a chip tap. CI adds
`npm run check -w fooddata`.

**Target Platform**: iOS and Android (Expo SDK 57) for the app; Node 22 on Windows/Linux for the
pipeline.

**Project Type**: mobile app + backend-as-a-service (npm-workspaces monorepo) + an internal data tool.

**Performance Goals**: search results within 300 ms of the last keystroke over ~500 foods / ~2000
aliases (SC-006); a full pipeline build under 10 s.

**Constraints**: generic foods only (no brands); no TürKomp values; values computed, never typed,
for dishes; builds byte-reproducible and offline; grams 0 < g ≤ 5000; no change to saved meals.

**Scale/Scope**: ≥ 450 foods, ≥ 80 dishes, ~2000 aliases, ~600 portions; 1 schema migration, 1
generated list migration, 1 changed RPC, 2 changed screens.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
|---|---|---|
| I. Layered mobile architecture | Chips and stepper in `components/meals`, rules in `hooks/portionLogic.ts`, data through `foodService`; the pipeline is a `tools/` workspace outside the app | Pass |
| II. Validated boundaries | Search rows (now with `portions`) parsed by the core schema; pipeline sources and the USDA extract parsed by Zod | Pass |
| III. Server-owned numbers | Per-100 g values come from the database; items keep snapshotting them; dish values computed by the build, never typed | Pass |
| IV. User confirms the grams | Chips only fill the gram field; the user sees and edits it; the field is the saved value | Pass |
| V. One AI boundary | No AI in this part | Pass (n/a) |
| VI. Only code we use | `unit_weights` dropped (unused, replaced); every new file is used; knip covers `tools/fooddata` | Pass |
| VII. Turkish first | Turkish names, aliases and unit labels; search cases are real Turkish queries with suffixes and folded letters | Pass |
| VIII. Secure by default | `food_portions` under RLS, read-only to `authenticated`; no new grants beyond select; no keys needed (FDC download is public) | Pass |
| IX. Tested and measured | Build-rule tests, pgTAP incl. 100 generated search cases, app helper tests, CI determinism gate | Pass |
| Product scope: food data | The constitution names TürKomp "(licence to be confirmed)"; the owner declined it (2026-10-13). **Amend** the Food data line to "USDA FoodData Central and Open Food Facts; TürKomp not used (paid commercial licence)", PATCH bump, in this feature's first PR | Pass with amendment |

Post-design re-check (after data model and contracts): no new violations; the category check
change and the `unit_weights` drop are covered by VI; no complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-food-database/
├── plan.md              # This file
├── research.md          # Phase 0: USDA release, cooked weights, pipeline, outputs, search, review page
├── data-model.md        # Phase 1: schema changes, pipeline sources, build rules
├── quickstart.md        # Phase 1: build, review, ship, validate
├── contracts/
│   ├── database-api.md  # search_foods change, food_portions, list migrations
│   ├── pipeline.md      # fetch / build / check commands and output formats
│   └── screens.md       # review-step chips and stepper, profile credit
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
tools/fooddata/                      # new workspace, never shipped
├── package.json                     # scripts: fetch, build, check, test, typecheck
├── src/
│   ├── fetch.ts                     # FDC download + SHA-256 + extract
│   ├── build.ts                     # load sources → validate → write outputs
│   ├── rules.ts                     # the build rules (data-model.md)
│   ├── recipe.ts                    # cooked weight and per-100 g of a dish
│   ├── emit/sql.ts · summary.ts · review.ts · searchCases.ts
│   └── schemas.ts                   # Zod schemas of the source records
├── sources/
│   ├── usda/release.json · extract.json
│   ├── foods/*.ts                   # by category
│   ├── recipes/*.ts
│   ├── labels.ts · withdrawn.ts · search-cases.ts
├── out/foods.txt                    # committed summary
└── tests/*.test.ts
supabase/
├── migrations/<v>_food_schema.sql   # hand-written: columns, food_portions, category check, search_foods
├── migrations/<v>_food_list_1.sql   # generated
└── tests/database/food_portions.test.sql · search_cases.test.sql (generated)
packages/core/src/schemas/rows.ts    # foodHitRowSchema + portions
packages/core/src/db/database.types.ts  # regenerated
apps/mobile/src/
├── hooks/portionLogic.ts            # grams = unit × count, cap, selection reset
├── components/meals/DraftItemCard.tsx · PortionPicker.tsx (new)
└── app/(tabs)/profile.tsx           # Veri kaynakları
tools/preview/src/fakes/foodService.ts  # fake hits with portions
.github/workflows/ci.yml             # + npm run check -w fooddata
knip.json                            # + tools/fooddata entries
.specify/memory/constitution.md      # Food data line amended (2.0.2)
```

**Structure Decision**: The pipeline is a second `tools/*` workspace next to `tools/preview`, the
existing home for internal tools; the app and database keep the 001 layout.

## Complexity Tracking

No violations.
