-- 001 US2: the first-time setup and plan saving (contracts/database-api.md, FR-006–FR-008).
-- complete_onboarding(answers, plan) stores the setup answers, the first plan and the finished flag
-- in one transaction; save_plan(plan) replaces the active plan. Plans and onboarding_completed are
-- not writable through the API, so the work runs as the owner (security definer) in the `private`
-- schema, which the API does not expose; the public functions are thin security invoker entry
-- points (Supabase advisor lint 0029 flags security definer functions callable through the API).
-- Payloads use the core schemas' camelCase keys; the plan is core nutritionPlanSchema without `id`
-- and `createdAt`, which the database assigns. Errors raise a stable code as the message.

create schema private;
grant usage on schema private to authenticated;

-- True when v is a JSON number in [lo, hi], and a whole number when `whole`.
create function private.json_number_ok(v jsonb, lo numeric, hi numeric, whole boolean default false)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric between lo and hi and (not whole or (v #>> '{}')::numeric % 1 = 0)
    else false
  end
$$;

-- One day's targets (core macrosSchema): whole kcal and grams, 0–100000 like the core schema.
create function private.plan_day_ok(d jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_typeof(d) = 'object', false)
     and private.json_number_ok(d -> 'calories', 0, 100000, true)
     and private.json_number_ok(d -> 'protein', 0, 100000, true)
     and private.json_number_ok(d -> 'carbs', 0, 100000, true)
     and private.json_number_ok(d -> 'fat', 0, 100000, true)
$$;

-- The setup answers (core onboardingSchema): types, PROFILE_LIMITS ranges, enum values, whole
-- years of age, fat per kg 1.0–1.5 and a time zone the database can compute local dates in.
create function private.onboarding_answers_valid(a jsonb)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  tz text := a ->> 'timeZone';
begin
  if not coalesce(
    jsonb_typeof(a) = 'object'
    and a ->> 'sex' = any (enum_range(null::public.sex)::text[])
    and private.json_number_ok(a -> 'age', 15, 100, true)
    and private.json_number_ok(a -> 'heightCm', 100, 250)
    and private.json_number_ok(a -> 'weightKg', 30, 300)
    and private.json_number_ok(a -> 'targetWeightKg', 30, 300)
    and a ->> 'activity' = any (enum_range(null::public.activity_level)::text[])
    and a ->> 'dietStyle' = any (enum_range(null::public.diet_style)::text[])
    and private.json_number_ok(a -> 'fatPerKg', 1, 1.5)
    and jsonb_typeof(a -> 'timeZone') = 'string'
    and char_length(tz) <= 64
    and tz ~ '^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+)*$',
    false
  ) then
    return false;
  end if;
  begin
    perform now() at time zone tz;
  exception when invalid_parameter_value then
    return false;
  end;
  return true;
end;
$$;

-- Inserts `plan` as the owner's only active plan. Checks the shape here; the floor and the macro
-- sum are checked by the nutrition_plans_validate trigger, which reads the floor's sex from the
-- plan inputs, so that sex must be the profile's.
create function private.insert_active_plan(owner uuid, plan jsonb)
returns public.nutrition_plans
language plpgsql
set search_path = ''
as $$
declare
  inputs jsonb := plan -> 'inputs';
  cycle jsonb := plan -> 'cycle';
  owner_sex text;
  saved public.nutrition_plans;
begin
  select p.sex::text into owner_sex from public.profiles p where p.id = owner;
  if not coalesce(
    jsonb_typeof(plan) = 'object'
    and jsonb_typeof(inputs) = 'object'
    and inputs ->> 'sex' = owner_sex
    and private.json_number_ok(inputs -> 'age', 15, 100)
    and private.json_number_ok(inputs -> 'heightCm', 100, 250)
    and private.json_number_ok(inputs -> 'weightKg', 30, 300)
    and jsonb_typeof(inputs -> 'trainingDays') = 'array'
    and private.json_number_ok(plan -> 'bmr', 1, 100000, true)
    and private.json_number_ok(plan -> 'tdee', 1, 100000, true)
    and private.plan_day_ok(plan -> 'base')
    and (jsonb_typeof(cycle) = 'null' or (private.plan_day_ok(cycle -> 'training') and private.plan_day_ok(cycle -> 'rest')))
    and jsonb_typeof(plan -> 'strategySummary') = 'string'
    and char_length(plan ->> 'strategySummary') <= 1200,
    false
  ) then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;
  -- Weekdays 0 (Monday) … 6, at most seven.
  if jsonb_array_length(inputs -> 'trainingDays') > 7
     or exists (select 1 from jsonb_array_elements(inputs -> 'trainingDays') d where not private.json_number_ok(d, 0, 6, true)) then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;

  update public.nutrition_plans set is_active = false where user_id = owner and is_active;
  insert into public.nutrition_plans (
    user_id, inputs, bmr, tdee,
    base_kcal, base_protein_g, base_carbs_g, base_fat_g,
    training_kcal, training_protein_g, training_carbs_g, training_fat_g,
    rest_kcal, rest_protein_g, rest_carbs_g, rest_fat_g,
    training_days, summary, is_active
  ) values (
    owner, inputs, (plan ->> 'bmr')::numeric, (plan ->> 'tdee')::numeric,
    (plan #>> '{base,calories}')::numeric, (plan #>> '{base,protein}')::numeric, (plan #>> '{base,carbs}')::numeric, (plan #>> '{base,fat}')::numeric,
    (cycle #>> '{training,calories}')::numeric, (cycle #>> '{training,protein}')::numeric, (cycle #>> '{training,carbs}')::numeric, (cycle #>> '{training,fat}')::numeric,
    (cycle #>> '{rest,calories}')::numeric, (cycle #>> '{rest,protein}')::numeric, (cycle #>> '{rest,carbs}')::numeric, (cycle #>> '{rest,fat}')::numeric,
    array(select d.value::numeric::smallint from jsonb_array_elements_text(inputs -> 'trainingDays') with ordinality d order by d.ordinality),
    plan ->> 'strategySummary', true
  )
  returning * into saved;
  return saved;
end;
$$;

create function private.complete_onboarding(answers jsonb, plan jsonb)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  completed boolean;
  saved public.profiles;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  -- The row lock makes a second, concurrent call wait and then see already_completed.
  select p.onboarding_completed into completed from public.profiles p where p.id = uid for update;
  if not found then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if completed then
    raise exception 'already_completed' using errcode = '55000';
  end if;
  if not private.onboarding_answers_valid(answers) then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;
  -- The plan must be the one built from these answers.
  if not coalesce(plan -> 'inputs' @> jsonb_build_object(
    'sex', answers -> 'sex', 'age', answers -> 'age', 'heightCm', answers -> 'heightCm', 'weightKg', answers -> 'weightKg',
    'dietStyle', answers -> 'dietStyle', 'fatPerKg', answers -> 'fatPerKg'
  ), false) then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;

  update public.profiles p
     set sex = (answers ->> 'sex')::public.sex,
         -- The user's current year, as the app computes age from birth_year.
         birth_year = extract(year from now() at time zone (answers ->> 'timeZone'))::int - (answers ->> 'age')::numeric::int,
         height_cm = (answers ->> 'heightCm')::numeric,
         weight_kg = (answers ->> 'weightKg')::numeric,
         goal_weight_kg = (answers ->> 'targetWeightKg')::numeric,
         activity_level = (answers ->> 'activity')::public.activity_level,
         diet_style = (answers ->> 'dietStyle')::public.diet_style,
         fat_per_kg = (answers ->> 'fatPerKg')::numeric,
         time_zone = answers ->> 'timeZone',
         onboarding_completed = true
   where p.id = uid
  returning p.* into saved;
  perform private.insert_active_plan(uid, plan);
  return saved;
end;
$$;

create function private.save_plan(plan jsonb)
returns public.nutrition_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  completed boolean;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  -- The row lock serializes concurrent saves of one user, so one plan stays active.
  select p.onboarding_completed into completed from public.profiles p where p.id = uid for update;
  if not coalesce(completed, false) then
    raise exception 'onboarding_required' using errcode = '55000';
  end if;
  return private.insert_active_plan(uid, plan);
end;
$$;

-- The API: POST /rest/v1/rpc/complete_onboarding and /rest/v1/rpc/save_plan.
create function public.complete_onboarding(answers jsonb, plan jsonb)
returns public.profiles
language sql
security invoker
set search_path = ''
as $$
  select private.complete_onboarding(answers, plan)
$$;

create function public.save_plan(plan jsonb)
returns public.nutrition_plans
language sql
security invoker
set search_path = ''
as $$
  select private.save_plan(plan)
$$;

-- Signed-in users call the two RPCs (and their implementations); nobody calls the helpers.
revoke execute on all functions in schema private from public, anon, authenticated;
revoke execute on function public.complete_onboarding(jsonb, jsonb), public.save_plan(jsonb) from public, anon;
grant execute on function private.complete_onboarding(jsonb, jsonb), private.save_plan(jsonb) to authenticated;
grant execute on function public.complete_onboarding(jsonb, jsonb), public.save_plan(jsonb) to authenticated;
