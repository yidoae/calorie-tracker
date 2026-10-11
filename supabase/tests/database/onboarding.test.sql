-- US2 (T032): complete_onboarding stores the setup answers and the first plan in one step, save_plan
-- replaces the active plan; both refuse bad input with the codes of contracts/database-api.md, and
-- plans are written only through them (constitution III, FR-006–FR-008). Users A and B exist only
-- inside this transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(47);

insert into auth.users (id, email) values
  ('a2000000-0000-4000-8000-0000000000a2', 'onboarding-a@test.invalid'),
  ('b2000000-0000-4000-8000-0000000000b2', 'onboarding-b@test.invalid');

-- Payloads as the app sends them: core onboardingSchema answers and the buildPlan result for them
-- (without id and createdAt). Kept in transaction-local settings so every role can read them.
select set_config('test.answers',
  '{"age": 30, "sex": "female", "heightCm": 165, "weightKg": 70, "targetWeightKg": 62, "activity": "moderate",
    "dietStyle": "highProtein", "fatPerKg": 1.2, "timeZone": "Europe/Istanbul"}', true);
select set_config('test.plan',
  '{"inputs": {"sex": "female", "heightCm": 165, "weightKg": 70, "age": 30, "targetWeightKg": 62, "goal": "cut", "intensity": 500,
               "trainingStyle": "strength", "split": "upperLower", "trainingDays": [0, 1, 3, 4], "dietStyle": "highProtein",
               "fatPerKg": 1.2, "mealPattern": "classic", "fastingWindowStart": 12, "cycling": false},
    "bmr": 1476, "tdee": 2214, "base": {"calories": 1714, "protein": 154, "carbs": 86, "fat": 84}, "cycle": null,
    "strategySummary": "Test planı."}', true);
-- The same answers with calorie cycling on (training days 1920 kcal, rest days 1440 kcal).
select set_config('test.cycling_plan',
  jsonb_set(jsonb_set(current_setting('test.plan')::jsonb, '{inputs,cycling}', 'true'), '{cycle}',
    '{"training": {"calories": 1920, "protein": 154, "carbs": 175, "fat": 67}, "rest": {"calories": 1440, "protein": 154, "carbs": 0, "fat": 92}}')::text,
  true);

-- The API surface: two RPCs, neither callable anonymously; the private implementations (these two,
-- search_foods and log_meal) are callable only by signed-in users, the helpers by nobody.
select has_function('public', 'complete_onboarding', array['jsonb', 'jsonb'], 'complete_onboarding(answers, plan) exists');
select has_function('public', 'save_plan', array['jsonb'], 'save_plan(plan) exists');
select is_empty(
  $$select p.oid::regprocedure::text from pg_proc p
     where p.pronamespace::regnamespace::text = 'private' and has_function_privilege('anon', p.oid, 'execute')$$,
  'anon cannot execute any function in private');
select is_empty(
  $$select p.oid::regprocedure::text from pg_proc p
     where p.pronamespace::regnamespace::text = 'private' and has_function_privilege('authenticated', p.oid, 'execute')
       and p.proname not in ('complete_onboarding', 'save_plan', 'search_foods', 'log_meal')$$,
  'authenticated executes only the RPC implementations in private');

set local role anon;
select throws_ok($$select public.complete_onboarding(current_setting('test.answers')::jsonb, current_setting('test.plan')::jsonb)$$,
  '42501', null, 'an anonymous client cannot call complete_onboarding');
select throws_ok($$select public.save_plan(current_setting('test.plan')::jsonb)$$,
  '42501', null, 'an anonymous client cannot call save_plan');

-- A signed-in request without a user id.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);
select throws_ok($$select public.complete_onboarding(current_setting('test.answers')::jsonb, current_setting('test.plan')::jsonb)$$,
  '42501', 'not_authenticated', 'complete_onboarding needs a signed-in user');

-- User A, before setup.
select set_config('request.jwt.claims', json_build_object('sub', 'a2000000-0000-4000-8000-0000000000a2', 'role', 'authenticated')::text, true);

select throws_ok($$select public.save_plan(current_setting('test.plan')::jsonb)$$,
  '55000', 'onboarding_required', 'save_plan before the setup is refused');

select throws_ok(
  $$select public.complete_onboarding(jsonb_set(current_setting('test.answers')::jsonb, '{heightCm}', '300'), current_setting('test.plan')::jsonb)$$,
  '22023', 'invalid_answers', 'a height of 300 cm is refused');
select throws_ok(
  $$select public.complete_onboarding(jsonb_set(current_setting('test.answers')::jsonb, '{activity}', '"couch"'), current_setting('test.plan')::jsonb)$$,
  '22023', 'invalid_answers', 'an unknown activity level is refused');
select throws_ok(
  $$select public.complete_onboarding(jsonb_set(current_setting('test.answers')::jsonb, '{age}', '"30"'), current_setting('test.plan')::jsonb)$$,
  '22023', 'invalid_answers', 'an age sent as text is refused');
select throws_ok(
  $$select public.complete_onboarding(jsonb_set(current_setting('test.answers')::jsonb, '{timeZone}', '"Mars/Olympus"'), current_setting('test.plan')::jsonb)$$,
  '22023', 'invalid_answers', 'a time zone the database does not know is refused');

select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb,
      jsonb_set(current_setting('test.plan')::jsonb, '{base}', '{"calories": 1100, "protein": 100, "carbs": 100, "fat": 33}'))$$,
  '23514', 'plan_below_floor', 'a plan below 1200 kcal for a woman is refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb,
      jsonb_set(current_setting('test.plan')::jsonb, '{base,fat}', '50'))$$,
  '23514', 'plan_macros_mismatch', 'a plan whose macros do not add up is refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb,
      jsonb_set(current_setting('test.plan')::jsonb, '{base,calories}', '"1714"'))$$,
  '22023', 'invalid_plan', 'a plan with a calorie target sent as text is refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb,
      jsonb_set(current_setting('test.plan')::jsonb, '{inputs,sex}', '"male"'))$$,
  '22023', 'invalid_plan', 'a plan built for other answers than the ones sent is refused');

-- The stored inputs must parse with core planInputsSchema (the app reads them back with it).
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,goal}', '"lose"'))$$,
  '22023', 'invalid_plan', 'plan inputs with an unknown goal are refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,split}', '"bro"'))$$,
  '22023', 'invalid_plan', 'plan inputs with an unknown split are refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,mealPattern}', '"omad"'))$$,
  '22023', 'invalid_plan', 'plan inputs with an unknown meal pattern are refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,intensity}', '900'))$$,
  '22023', 'invalid_plan', 'plan inputs with an intensity above 800 are refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,fastingWindowStart}', '30'))$$,
  '22023', 'invalid_plan', 'plan inputs with an eating window starting at 30:00 are refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,trainingDays}', '[0, 0, 3, 4]'))$$,
  '22023', 'invalid_plan', 'plan inputs with a repeated training day are refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,trainingDays}', '[0]'))$$,
  '22023', 'invalid_plan', 'a strength routine with one training day a week is refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,targetWeightKg}', '75'))$$,
  '22023', 'invalid_plan', 'a cut towards a goal weight above today''s weight is refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.plan')::jsonb, '{inputs,cycling}', 'true'))$$,
  '22023', 'invalid_plan', 'cycling switched on for a training routine without training/rest targets is refused');
select throws_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, jsonb_set(current_setting('test.cycling_plan')::jsonb, '{inputs,cycling}', 'false'))$$,
  '22023', 'invalid_plan', 'training/rest targets with cycling switched off are refused');

select results_eq(
  $$select onboarding_completed, height_cm from public.profiles$$,
  $$values (false, null::numeric)$$,
  'the refused calls changed nothing on the profile');
select is_empty($$select 1 from public.nutrition_plans$$, 'the refused calls stored no plan');

select lives_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, current_setting('test.plan')::jsonb)$$,
  'complete_onboarding with valid answers and their plan succeeds');
select results_eq(
  $$select sex::text, birth_year, height_cm, weight_kg, goal_weight_kg, activity_level::text, diet_style::text, fat_per_kg, time_zone, onboarding_completed
      from public.profiles$$,
  $$values ('female', extract(year from now() at time zone 'Europe/Istanbul')::int - 30, 165.0, 70.0, 62.0, 'moderate', 'highProtein', 1.20, 'Europe/Istanbul', true)$$,
  'the profile holds the answers, birth year = current year − age, and setup is complete');
select results_eq(
  $$select is_active, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g, training_kcal, training_days, summary from public.nutrition_plans$$,
  $$values (true, 1476, 2214, 1714, 154, 86, 84, null::int, '{0,1,3,4}'::smallint[], 'Test planı.')$$,
  'exactly one plan is stored, active, with the sent targets');
select is((select inputs from public.nutrition_plans), current_setting('test.plan')::jsonb -> 'inputs', 'the plan keeps the wizard inputs');

select throws_ok($$select public.complete_onboarding(current_setting('test.answers')::jsonb, current_setting('test.plan')::jsonb)$$,
  '55000', 'already_completed', 'a second complete_onboarding is refused');

select lives_ok($$select public.save_plan(current_setting('test.cycling_plan')::jsonb)$$, 'save_plan stores a cycling plan');
select results_eq(
  $$select is_active, base_kcal, training_kcal, training_protein_g, training_carbs_g, training_fat_g, rest_kcal, rest_protein_g, rest_carbs_g, rest_fat_g
      from public.nutrition_plans order by created_at, is_active$$,
  $$values (false, 1714, null::int, null::int, null::int, null::int, null::int, null::int, null::int, null::int),
           (true, 1714, 1920, 154, 175, 67, 1440, 154, 0, 92)$$,
  'save_plan deactivates the previous plan; the new one is the only active plan');

select throws_ok(
  $$select public.save_plan(jsonb_set(current_setting('test.cycling_plan')::jsonb, '{cycle,rest}', '{"calories": 1150, "protein": 100, "carbs": 120, "fat": 30}'))$$,
  '23514', 'plan_below_floor', 'save_plan refuses a rest day below the floor');
select throws_ok(
  $$select public.save_plan(jsonb_set(current_setting('test.plan')::jsonb, '{inputs,sex}', '"male"'))$$,
  '22023', 'invalid_plan', 'save_plan refuses a plan for another sex than the profile''s (it would move the floor)');
select results_eq($$select count(*)::int, count(*) filter (where is_active)::int from public.nutrition_plans$$, $$values (2, 1)$$,
  'refused plans leave the two plans and the one active plan as they were');

select throws_ok(
  $$insert into public.nutrition_plans (user_id, inputs, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g)
    values ('a2000000-0000-4000-8000-0000000000a2', current_setting('test.plan')::jsonb -> 'inputs', 1476, 2214, 1714, 154, 86, 84)$$,
  '42501', null, 'a signed-in user cannot insert a plan directly');
select throws_ok(
  $$update public.nutrition_plans set is_active = true where user_id = 'a2000000-0000-4000-8000-0000000000a2'$$,
  '42501', null, 'a signed-in user cannot switch plans directly');

-- Real buildPlan outputs that the input checks must keep accepting.
select lives_ok(
  $$select public.save_plan('{"inputs": {"sex": "female", "heightCm": 165, "weightKg": 70, "age": 30, "targetWeightKg": 62, "goal": "cut", "intensity": 500,
      "trainingStyle": "sedentary", "split": null, "trainingDays": [], "dietStyle": "highProtein", "fatPerKg": 1.2, "mealPattern": "classic",
      "fastingWindowStart": 12, "cycling": false},
    "bmr": 1476, "tdee": 1771, "base": {"calories": 1271, "protein": 154, "carbs": 0, "fat": 73}, "cycle": null, "strategySummary": "Test planı."}')$$,
  'save_plan accepts a sedentary plan without training days');
select lives_ok(
  $$select public.save_plan('{"inputs": {"sex": "female", "heightCm": 165, "weightKg": 70, "age": 30, "targetWeightKg": 62, "goal": "cut", "intensity": 500,
      "trainingStyle": "sedentary", "split": null, "trainingDays": [], "dietStyle": "highProtein", "fatPerKg": 1.2, "mealPattern": "classic",
      "fastingWindowStart": 12, "cycling": true},
    "bmr": 1476, "tdee": 1771, "base": {"calories": 1271, "protein": 154, "carbs": 0, "fat": 73}, "cycle": null, "strategySummary": "Test planı."}')$$,
  'save_plan accepts cycling switched on for a sedentary routine (the engine builds no cycle without training days)');
select lives_ok(
  $$select public.save_plan('{"inputs": {"sex": "female", "heightCm": 165, "weightKg": 70, "age": 30, "targetWeightKg": null, "goal": "maintain", "intensity": 0,
      "trainingStyle": "strength", "split": "upperLower", "trainingDays": [0, 1, 3, 4], "dietStyle": "highProtein", "fatPerKg": 1.2, "mealPattern": "classic",
      "fastingWindowStart": 12, "cycling": false},
    "bmr": 1476, "tdee": 2214, "base": {"calories": 2214, "protein": 154, "carbs": 211, "fat": 84}, "cycle": null, "strategySummary": "Test planı."}')$$,
  'save_plan accepts a maintain plan without a goal weight');
select results_eq(
  $$select inputs ->> 'goal', inputs -> 'targetWeightKg', base_kcal, count(*) over ()::int from public.nutrition_plans where is_active$$,
  $$values ('maintain', 'null'::jsonb, 2214, 1)$$,
  'the last saved plan is the only active one');

-- User B sets up their own account; A's plans are untouched and invisible to B.
select set_config('request.jwt.claims', json_build_object('sub', 'b2000000-0000-4000-8000-0000000000b2', 'role', 'authenticated')::text, true);
select lives_ok(
  $$select public.complete_onboarding(current_setting('test.answers')::jsonb, current_setting('test.plan')::jsonb)$$,
  'B completes their own setup');
select results_eq($$select count(*)::int from public.nutrition_plans$$, $$values (1)$$, 'B sees only their own plan');

reset role;
select results_eq(
  $$select user_id, count(*)::int, count(*) filter (where is_active)::int from public.nutrition_plans
     where user_id in ('a2000000-0000-4000-8000-0000000000a2', 'b2000000-0000-4000-8000-0000000000b2')
     group by user_id order by user_id$$,
  $$values ('a2000000-0000-4000-8000-0000000000a2'::uuid, 5, 1), ('b2000000-0000-4000-8000-0000000000b2'::uuid, 1, 1)$$,
  'each user has their own plans with one active plan each; B''s setup did not touch A''s');

select * from finish();
rollback;
