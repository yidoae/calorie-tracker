-- 001 mobile foundation: enums, tables, Row Level Security and column privileges.
-- specs/001-mobile-foundation/data-model.md. Constitution III (server-owned numbers) and VIII
-- (RLS on every table). Writes that must be atomic go through the RPCs of later migrations.

create extension if not exists pg_trgm with schema extensions;

create type public.sex as enum ('male', 'female');
create type public.activity_level as enum ('sedentary', 'light', 'moderate', 'active', 'veryActive');
create type public.diet_style as enum ('highProtein', 'lowCarb', 'keto', 'iifym');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack');

-- Turkish-aware search key: Turkish letters folded to ASCII, lower-cased, spaces collapsed.
-- @calorie/core's normalizeTr must return the same string (checked by supabase/tests/search.test.ts).
create function public.normalize_tr(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(lower(translate(t, 'İIıÇçĞğÖöŞşÜüÂâÎîÛû', 'iiiccggoossuuaaiiuu')), '\s+', ' ', 'g'))
$$;

-- profiles: one per account, created by a trigger on auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  sex public.sex,
  birth_year int check (birth_year between 1900 and 2100),
  height_cm numeric(5, 1) check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) check (weight_kg between 30 and 300),
  goal_weight_kg numeric(5, 1) check (goal_weight_kg between 30 and 300),
  activity_level public.activity_level,
  diet_style public.diet_style,
  fat_per_kg numeric(3, 2) not null default 1.20 check (fat_per_kg between 1.00 and 1.50),
  time_zone text check (char_length(time_zone) between 1 and 64),
  onboarding_completed boolean not null default false,
  sensitive_warning_ack boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- nutrition_plans: the plan history; exactly one active plan per user.
create table public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  inputs jsonb not null,
  bmr int not null check (bmr > 0),
  tdee int not null check (tdee > 0),
  base_kcal int not null,
  base_protein_g int not null,
  base_carbs_g int not null,
  base_fat_g int not null,
  training_kcal int,
  training_protein_g int,
  training_carbs_g int,
  training_fat_g int,
  rest_kcal int,
  rest_protein_g int,
  rest_carbs_g int,
  rest_fat_g int,
  training_days smallint[] not null default '{}',
  summary text not null default '' check (char_length(summary) <= 1200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint cycle_all_or_none check (
    num_nulls(training_kcal, training_protein_g, training_carbs_g, training_fat_g,
              rest_kcal, rest_protein_g, rest_carbs_g, rest_fat_g) in (0, 8)
  )
);
create unique index nutrition_plans_one_active on public.nutrition_plans (user_id) where is_active;

-- foods: the shared food database (curated seed in 001; sources, barcodes and own foods in 002).
create table public.foods (
  id text primary key check (id ~ '^[a-z0-9_]{1,64}$'),
  name_tr text not null check (char_length(name_tr) between 1 and 80),
  category text not null check (category in ('protein', 'carb', 'fat', 'vegetable', 'fruit', 'dairy', 'drink', 'mixed')),
  kcal_per_100g numeric(6, 2) not null check (kcal_per_100g between 0 and 900),
  protein_per_100g numeric(6, 2) not null check (protein_per_100g between 0 and 100),
  carbs_per_100g numeric(6, 2) not null check (carbs_per_100g between 0 and 100),
  fat_per_100g numeric(6, 2) not null check (fat_per_100g between 0 and 100),
  typical_portion_g numeric(6, 1) not null check (typical_portion_g > 0),
  unit_weights jsonb not null default '{}'
);

create table public.food_aliases (
  food_id text not null references public.foods (id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 60),
  alias_normalized text generated always as (public.normalize_tr(alias)) stored,
  primary key (food_id, alias)
);
create index food_aliases_trgm on public.food_aliases using gin (alias_normalized extensions.gin_trgm_ops);

-- meals and their items; totals and per-100 g snapshots are written by triggers only.
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slot public.meal_slot not null,
  local_date date not null,
  time_zone text not null check (char_length(time_zone) between 1 and 64),
  logged_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 80),
  total_kcal numeric(8, 1) not null default 0,
  total_protein_g numeric(8, 1) not null default 0,
  total_carbs_g numeric(8, 1) not null default 0,
  total_fat_g numeric(8, 1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meals_user_day on public.meals (user_id, local_date);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  food_id text not null references public.foods (id),
  grams numeric(6, 1) not null check (grams > 0 and grams <= 5000),
  kcal_per_100g numeric(6, 2) not null default 0,
  protein_per_100g numeric(6, 2) not null default 0,
  carbs_per_100g numeric(6, 2) not null default 0,
  fat_per_100g numeric(6, 2) not null default 0,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);
create index meal_items_meal on public.meal_items (meal_id);
create index meal_items_user on public.meal_items (user_id);

-- Row Level Security: on for every table; policies only for the signed-in owner.
alter table public.profiles enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.foods enable row level security;
alter table public.food_aliases enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;

create policy "own profile: read" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own plans: read" on public.nutrition_plans for select to authenticated using (user_id = (select auth.uid()));

create policy "foods: read" on public.foods for select to authenticated using (true);
create policy "food aliases: read" on public.food_aliases for select to authenticated using (true);

create policy "own meals: read" on public.meals for select to authenticated using (user_id = (select auth.uid()));
create policy "own meals: update" on public.meals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own meals: delete" on public.meals for delete to authenticated using (user_id = (select auth.uid()));

create policy "own meal items: read" on public.meal_items for select to authenticated using (user_id = (select auth.uid()));
create policy "own meal items: add" on public.meal_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own meal items: update" on public.meal_items for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own meal items: delete" on public.meal_items for delete to authenticated using (user_id = (select auth.uid()));

-- Column privileges: the app may write only what the user chooses; computed columns, ownership
-- and onboarding_completed stay with triggers and RPCs. Nothing for anonymous clients.
revoke all on public.profiles, public.nutrition_plans, public.foods, public.food_aliases, public.meals, public.meal_items
  from anon, authenticated;

grant select on public.profiles, public.nutrition_plans, public.foods, public.food_aliases, public.meals, public.meal_items
  to authenticated;
grant update (sex, birth_year, height_cm, weight_kg, goal_weight_kg, activity_level, diet_style, fat_per_kg, time_zone, sensitive_warning_ack)
  on public.profiles to authenticated;
grant update (slot, name) on public.meals to authenticated;
grant delete on public.meals to authenticated;
grant insert (meal_id, food_id, grams, position) on public.meal_items to authenticated;
grant update (food_id, grams, position) on public.meal_items to authenticated;
grant delete on public.meal_items to authenticated;
