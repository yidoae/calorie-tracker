# Data Model: Mobile Foundation

Postgres on Supabase, schema `public`. Every table has Row Level Security enabled (constitution
VIII). Numbers that must not be trusted to the app (meal totals, item nutrition, plan invariants) are
written or checked by the database itself (constitution III). Names are English; user-facing
labels come from `@calorie/core`.

## Enums

Enum values are the same strings `@calorie/core` uses (camelCase where the core does), so rows map without translation.


| Enum | Values |
|---|---|
| `sex` | `male`, `female` |
| `activity_level` | `sedentary`, `light`, `moderate`, `active`, `veryActive` |
| `diet_style` | `highProtein`, `lowCarb`, `keto`, `iifym` |
| `meal_slot` | `breakfast`, `lunch`, `dinner`, `snack` |

## profiles

One row per account, created by a trigger when Supabase Auth creates the user.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | = `auth.users.id`, cascade on delete |
| `sex` | `sex` | null until setup |
| `birth_year` | int | null until setup; age 15–100 at save time |
| `height_cm` | numeric(5,1) | 100–250 |
| `weight_kg` | numeric(5,1) | 30–300 (setup weight; weigh-ins arrive in 004) |
| `goal_weight_kg` | numeric(5,1) null | 30–300 |
| `activity_level` | `activity_level` | null until setup |
| `diet_style` | `diet_style` | null until setup |
| `fat_per_kg` | numeric(3,2) | 1.00–1.50, default 1.20 |
| `time_zone` | text | IANA name from the device, e.g. `Europe/Istanbul` |
| `onboarding_completed` | boolean | default false; set only by `complete_onboarding` |
| `sensitive_warning_ack` | boolean | default false |
| `created_at`, `updated_at` | timestamptz | |

RLS: select/update own row (`id = auth.uid()`); no insert/delete from the app (trigger and
cascade only). `onboarding_completed` cannot be changed by a direct update (column privilege
revoked; only the RPC sets it).

## nutrition_plans

The plan history; exactly one active plan per user.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `inputs` | jsonb | the wizard answers (`PlanInputs`, validated by the app with the core schema) |
| `bmr`, `tdee` | int | > 0 |
| `base_kcal`, `base_protein_g`, `base_carbs_g`, `base_fat_g` | int | targets for every day, or the weekly average when cycling |
| `training_*`, `rest_*` (same four each) | int null | all set when cycling, all null otherwise |
| `training_days` | smallint[] | weekday indexes, Monday = 0; empty when not cycling |
| `summary` | text | ≤ 1200 chars |
| `is_active` | boolean | partial unique index: one active plan per `user_id` |
| `created_at` | timestamptz | |

Validation trigger (before insert/update), for the base day and, when cycling, the training and
rest days:
- calories ≥ 1200 when `inputs->>'sex' = 'female'`, ≥ 1500 when `'male'` (FR-008);
- |protein·4 + carbs·4 + fat·9 − calories| ≤ max(10, 1 % of calories);
- all grams ≥ 0.

RLS: select own rows; writes only through `save_plan` / `complete_onboarding`.

## foods

The shared food database. In 001 it holds the curated set (about 80 foods) carried over from the web
app as a seed migration; feature 002 extends it (sources, barcodes, own foods via `owner_id`).

| Column | Type | Rules |
|---|---|---|
| `id` | text PK | stable slug, e.g. `chicken_breast_grilled` |
| `name_tr` | text | display name |
| `category` | text | protein, carb, fat, vegetable, fruit, dairy, drink, mixed |
| `kcal_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g` | numeric(6,2) | ≥ 0; kcal ≤ 900; macros ≤ 100 |
| `typical_portion_g` | numeric(6,1) | > 0; a hint only, never a default amount (FR-013) |
| `unit_weights` | jsonb | e.g. `{"dilim": 25, "adet": 50}` |

## food_aliases

| Column | Type | Rules |
|---|---|---|
| `food_id` | text FK → foods | |
| `alias` | text | as written, lower-case Turkish |
| `alias_normalized` | text | generated: `normalize_tr(alias)`, an IMMUTABLE SQL function that folds Turkish letters (İ I ı Ç Ğ Ö Ş Ü) to ASCII and lower-cases; must match core `normalizeTr` |

Index: trigram (`pg_trgm`) on `alias_normalized`. RLS on `foods` and `food_aliases`: select for
authenticated users; no writes from the app.

## meals

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `slot` | `meal_slot` | |
| `local_date` | date | the user's local date at logging (FR-016); within ±1 day of `now()` in `time_zone` at insert |
| `time_zone` | text | IANA name |
| `logged_at` | timestamptz | default `now()` |
| `name` | text | ≤ 80 chars; built by the app from the items |
| `total_kcal`, `total_protein_g`, `total_carbs_g`, `total_fat_g` | numeric(8,1) | written only by the totals trigger (FR-015) |
| `created_at`, `updated_at` | timestamptz | |

Index: (`user_id`, `local_date`).

## meal_items

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `meal_id` | uuid FK → meals, cascade | |
| `user_id` | uuid | copied from the meal by trigger; used by RLS |
| `food_id` | text FK → foods | |
| `grams` | numeric(6,1) | > 0 and ≤ 5000 (FR-013) |
| `kcal_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g` | numeric(6,2) | snapshot copied from `foods` by trigger when the item is created or its food changes; the app cannot set them |
| `position` | smallint | order in the meal |

Triggers:
- before insert/update: set `user_id` from the meal and reject if the meal is not the caller's;
  copy the per-100 g snapshot from `foods`.
- after insert/update/delete: recompute the parent meal's four totals as
  Σ grams × per-100 g / 100, rounded to one decimal.

RLS on `meals` and `meal_items`: select/update/delete own rows (`user_id = auth.uid()`); inserts
only through `log_meal` so a meal is never saved without its items.

## Relationships

```text
auth.users 1─1 profiles 1─* nutrition_plans
                       1─* meals 1─* meal_items *─1 foods 1─* food_aliases
```

## State transitions

- **Account**: signed up → e-mail confirmed (e-mail sign-ups only) → `onboarding_completed = false`
  → `complete_onboarding` → `true`. The app routes on this flag (FR-006).
- **Plan**: `save_plan` inserts the new plan with `is_active = true` and sets the previous active
  plan to `false` in the same transaction.
- **Meal**: created with its items by `log_meal`; items edited or removed afterwards; deleting the
  last item leaves an empty meal, which the app offers to delete.
