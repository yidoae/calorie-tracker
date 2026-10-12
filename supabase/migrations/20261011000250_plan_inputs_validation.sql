-- 001 US2 review fix: a stored plan's `inputs` must parse with core planInputsSchema, because the app
-- reads every plan row back with it (planRowSchema) and one bad row breaks getActivePlan. Until now
-- insert_active_plan checked only sex, age, height, weight and the training-day values.
-- plan_inputs_valid mirrors planInputsSchema (packages/core/src/schemas/plan.ts): the enums, the
-- ranges, the three refines, and the buildPlan rule that training/rest targets exist exactly when
-- cycling is on for a routine with training days. Keep the two in step.

-- True when `i` parses with core planInputsSchema and `has_cycle` matches what buildPlan would build.
-- plpgsql so the shape checks run before any cast.
create function private.plan_inputs_valid(i jsonb, has_cycle boolean)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  days jsonb := i -> 'trainingDays';
  target numeric;
  weight numeric;
begin
  if not coalesce(
    jsonb_typeof(i) = 'object'
    and i ->> 'sex' = any (array['male', 'female'])
    and private.json_number_ok(i -> 'heightCm', 100, 250)
    and private.json_number_ok(i -> 'weightKg', 30, 300)
    and private.json_number_ok(i -> 'age', 15, 100)
    and (jsonb_typeof(i -> 'targetWeightKg') = 'null' or private.json_number_ok(i -> 'targetWeightKg', 30, 300))
    and i ->> 'goal' = any (array['cut', 'maintain', 'bulk'])
    and private.json_number_ok(i -> 'intensity', 0, 800)
    and i ->> 'trainingStyle' = any (array['strength', 'functional', 'cardio', 'sedentary'])
    and (jsonb_typeof(i -> 'split') = 'null' or i ->> 'split' = any (array['fullBody', 'upperLower', 'ppl']))
    and jsonb_typeof(days) = 'array'
    and i ->> 'dietStyle' = any (array['highProtein', 'lowCarb', 'keto', 'iifym'])
    -- Optional: planInputsSchema defaults a missing fatPerKg to 1.2.
    and (not i ? 'fatPerKg' or private.json_number_ok(i -> 'fatPerKg', 1, 1.5))
    and i ->> 'mealPattern' = any (array['classic', 'if168'])
    and private.json_number_ok(i -> 'fastingWindowStart', 6, 16, true)
    and jsonb_typeof(i -> 'cycling') = 'boolean',
    false
  ) then
    return false;
  end if;

  -- Weekdays 0 (Monday) … 6, each at most once; 2–6 of them unless sedentary.
  if exists (select 1 from jsonb_array_elements(days) d where not private.json_number_ok(d, 0, 6, true))
     or (select count(distinct d) <> count(*) from jsonb_array_elements(days) d)
     or (i ->> 'trainingStyle' <> 'sedentary' and jsonb_array_length(days) not between 2 and 6) then
    return false;
  end if;

  -- targetWeightMatchesGoal: below today's weight to cut, above to bulk.
  if jsonb_typeof(i -> 'targetWeightKg') = 'number' then
    target := (i ->> 'targetWeightKg')::numeric;
    weight := (i ->> 'weightKg')::numeric;
    if (i ->> 'goal' = 'cut' and target >= weight) or (i ->> 'goal' = 'bulk' and target <= weight) then
      return false;
    end if;
  end if;

  -- formulaPlan builds a cycle only when cycling is on and there are training days (none when sedentary).
  return has_cycle = ((i ->> 'cycling')::boolean and i ->> 'trainingStyle' <> 'sedentary');
end;
$$;

-- As in 20261011000200, with the inputs checked by plan_inputs_valid.
create or replace function private.insert_active_plan(owner uuid, plan jsonb)
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
    and inputs ->> 'sex' = owner_sex
    and private.plan_inputs_valid(inputs, jsonb_typeof(cycle) = 'object')
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

-- Nobody calls the helper directly (function_privileges already removes PUBLIC's default).
revoke execute on function private.plan_inputs_valid(jsonb, boolean) from public, anon, authenticated;
