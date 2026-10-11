# Contract: Database API (Supabase)

The app talks to Supabase only from `apps/mobile/src/services/` (constitution I). Reads use the
tables directly under RLS; every write that must be atomic or validated goes through a
`security definer` function called with `supabase.rpc(...)`. All functions check
`auth.uid() is not null` and act only on the caller's rows. Inputs and outputs are validated in the
app with the matching `@calorie/core` schema (constitution II). Errors are raised with a stable
`code` the app maps to Turkish messages. JSON payloads use the core schemas' camelCase keys
(`heightCm`, `localDate`, `foodId`); rows come back snake_case and are mapped by
`@calorie/core/schemas/rows`.

## Access matrix (authenticated role)

| Table | select | insert | update | delete |
|---|---|---|---|---|
| `profiles` | own | — (trigger) | own, except `onboarding_completed` | — (cascade) |
| `nutrition_plans` | own | via RPC | — | — |
| `foods`, `food_aliases` | all | — | — | — |
| `meals` | own | via RPC | own (`slot`, `name`) | own |
| `meal_items` | own | own (adds to an own meal) | own (`grams`, `food_id`, `position`) | own |

Anonymous role: no access to any table.

## Functions

### `complete_onboarding(answers jsonb, plan jsonb) → profiles`
- `answers`: `{ sex, age, heightCm, weightKg, targetWeightKg, activity, dietStyle, fatPerKg, timeZone }`
  (core `onboardingSchema`).
- `plan`: the plan the app built with `buildPlan` from those answers (core `nutritionPlanSchema`).
- Updates the profile (`birth_year` = current year − age), inserts the plan as active through the
  same path as `save_plan`, sets `onboarding_completed = true`; one transaction.
- Errors: `invalid_answers`, `plan_below_floor`, `plan_macros_mismatch`, `already_completed`,
  `invalid_plan` (not shaped like the core schema, or built for other answers). `inputs` is checked
  like core `planInputsSchema` (enums, ranges, refines), and `cycle` must be set exactly when
  `inputs.cycling` is on for a routine that is not sedentary, as `buildPlan` does.

### `save_plan(plan jsonb) → nutrition_plans`
- Inserts the plan as active and deactivates the previous one. The validation trigger enforces the
  floor and macro-sum invariants for every day.
- Errors: `plan_below_floor`, `plan_macros_mismatch`, `onboarding_required`, `invalid_plan`
  (also when `inputs.sex` is not the profile's: the floor follows the account's sex).
- Both functions: the plan is sent without `id` and `createdAt` (core `planPayloadSchema`), which
  the database assigns; `not_authenticated` without a signed-in user. The `security definer` bodies
  live in the unexposed `private` schema behind `security invoker` wrappers in `public`
  (supabase/README.md).

### `log_meal(slot meal_slot, local_date date, time_zone text, name text, items jsonb) → meals`
- `items`: `[{ foodId, grams }]` (core `logMealPayloadSchema`), 1–30 entries, grams > 0 and ≤ 5000
  (and still > 0 at one decimal). Nutrition snapshots and totals are filled by the triggers; any
  nutrition values in the payload are ignored.
- `local_date` must be within ±1 day of today in `time_zone`.
- Returns the meal with its computed totals.
- Errors: `no_items`, `too_many_items`, `invalid_grams`, `unknown_food`, `date_out_of_range`,
  `onboarding_required`, `invalid_meal` (blank or over-long name, a time zone the database does not
  know, `items` not a list), `not_authenticated`.
- Items are changed afterwards through `meal_items` (update `grams`, delete) and meals deleted
  through `meals`; the triggers recompute the totals.

### `search_foods(q text, max_results int default 20) → setof (food_id, name_tr, matched_alias, typical_portion_g, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, score)`
- `q` is the text as typed plus the suffix candidates from core `searchStems` ("tavuğu" → "tavuk"),
  space-separated, 1–60 chars; the function normalizes it with `normalize_tr`.
- Ranking: exact alias match (the alias appears in `q` as whole words; longer aliases first), then
  prefix match (the alias starts with `q` or one of its words), then trigram similarity ≥ 0.3; one
  row per food (best alias). `max_results` defaults to 20 and is capped at 50.
- Errors: `invalid_query` (`q` missing, blank or over 60 characters, `max_results` < 1),
  `not_authenticated`.
- `log_meal` and `search_foods` also keep their `security definer` bodies in `private` behind
  `security invoker` wrappers (`normalize_tr` is not executable by the API roles).

## Reads used by the app

| Need | Query |
|---|---|
| Session's profile | `profiles` where `id = auth.uid()` |
| Active plan | `nutrition_plans` where `is_active` |
| A day's meals with items | `meals` (+ `meal_items(*, foods(name_tr))`) where `local_date = $date` order by `logged_at` |
| Calendar month | `meals` select `local_date, total_kcal` where `local_date` in the month; the app sums per day and rates each day against that day's targets with core `rateDay` |

## Generated types

`supabase gen types typescript` writes `packages/core/src/db/database.types.ts`; services use it
for the Supabase client and still validate rows with the core schemas.
