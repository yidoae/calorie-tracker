# Quickstart: Food Database (part A)

How to build the food list and prove the feature works. Setup of the app and the dev project is
in [001 quickstart](../001-mobile-foundation/quickstart.md).

## Prerequisites

- 001 running against the dev project (`kalori-takip-dev`).
- Network for the one-time USDA `fetch`; everything else runs offline.

## 1. Build the list

```bash
npm run fetch -w fooddata        # once per pinned USDA release; updates sources/usda/extract.json
npm run build -w fooddata        # out/foods.txt, dist/review.html, search_cases.test.sql
npm run build -w fooddata        # again: git status shows no change (SC-003)
```

Expected: the build prints the food count (≥ 450) and dish count (≥ 80) and exits 0
([pipeline.md](./contracts/pipeline.md)).

## 2. Build rules catch bad data

Temporarily, one at a time, then revert:

1. Give two foods the same alias → build fails naming both ids.
2. Set a recipe's cooked weight above its ingredients + water → fails naming the dish.
3. Set a food's kcal 30 % off its macros → fails naming the food.
4. Put a brand word into a label food's name → fails naming the food.

## 3. Owner review (SC-008)

Publish `tools/fooddata/dist/review.html` as an artifact. Search "mercimek", filter category
`dish`, open "Mercimek çorbası": ingredients, water, yield kind and cooked weight are shown. The
owner signs off in the PR.

## 4. Ship to the dev project

```bash
npm run build -w fooddata -- --release <YYYYMMDDHHMMSS>   # writes the list migration
```

Apply the schema migration and the list migration (MCP `apply_migration` or
`npx supabase db push`), regenerate `database.types.ts`, run the database tests (including the
generated `search_cases.test.sql`) and the security advisor ([database-api.md](./contracts/database-api.md)).

Expected: SC-002 (≥ 95 of 100 first, all within top 3); a meal saved before the release shows the
same totals afterwards (SC-007): note one day's totals before applying, compare after.

## 5. App, on a phone (Expo Go)

1. Search "yumurta" → "Yumurta" first; choose it.
2. Tap "adet" → field shows one egg's grams; tap "+" → twice that; totals follow (US2).
3. Type a gram value → the chip deselects; save → the meal holds the typed grams.
4. Search "sut", "tavuğu", "pilavi" → the same foods as "süt", "tavuk", "pilav" (US1-3).
5. Search "pirinç" → "Pirinç (çiğ)" first; "Pirinç pilavı (pişmiş)" below (FR-005).
6. Type quickly in search: results appear within 300 ms of the last keystroke (SC-006).
7. Profil → "Veri kaynakları" shows the USDA credit (FR-015).

## Automated checks

```bash
npm test && npm run typecheck && npm run lint && npm run knip
npm run check -w fooddata
```
