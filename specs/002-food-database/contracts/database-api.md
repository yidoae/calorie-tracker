# Contract: Database API changes (002 part A)

Only what changes from [001 database-api](../../001-mobile-foundation/contracts/database-api.md).

## Access matrix additions (authenticated role)

| Object | select | insert / update / delete |
|---|---|---|
| `food_portions` | all rows | none (migrations only) |
| `foods` new columns (`alcohol_per_100g`, `source_kind`, `source_ref`, `withdrawn`) | yes | none |

`anon` has no access, as in 001.

## `search_foods(q text, max_results int default 20)` (changed)

Returns `setof (food_id, name_tr, matched_alias, typical_portion_g, kcal_per_100g,
protein_per_100g, carbs_per_100g, fat_per_100g, portions, score)`.

- **New column `portions jsonb`**: the food's unit portions ordered by `position`, as
  `[{"unit": "adet", "grams": 50}, …]`; `[]` when the food has none. Validated in the app by the
  core `foodHitRowSchema` (extended), mapped to `portions: {unit, grams}[]`.
- **Withdrawn foods** (`withdrawn = true`) are never returned.
- Ranking, `q` rules, the 50-row cap, errors (`invalid_query`, `not_authenticated`) and the
  `private` body behind a `security invoker` wrapper are unchanged.
- The return type changes, so the migration drops and recreates both functions and re-applies the
  001 `revoke`/`grant` lines.

## Reads used by the app (unchanged)

A day's meals still join `foods(name_tr)`; withdrawn foods stay readable there (FR-010).

## Food list migrations (generated)

`supabase/migrations/<version>_food_list_<n>.sql`, written by `tools/fooddata` (see
[pipeline.md](./pipeline.md)), applied like any migration. In one transaction:

1. `insert into foods … on conflict (id) do update set` every column but `id`.
2. `delete from food_aliases where food_id in (<listed ids>)`, then insert the aliases.
3. `delete from food_portions where food_id in (<listed ids>)`, then insert the portions.
4. `update foods set withdrawn = true where id in (<withdrawn ids>)`; listed foods get
   `withdrawn = false`.
5. `alter table foods validate constraint foods_category_check`.

It never deletes from `foods` and never writes `meals` or `meal_items`.

## Generated types

Regenerate `packages/core/src/db/database.types.ts` after the schema migration and after the
`search_foods` change.
