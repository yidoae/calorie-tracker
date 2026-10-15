-- Triggers keep the numbers server-owned (constitution III, FR-008, FR-015, SC-006), and the
-- trigger and helper functions behind them cannot be called through the API (constitution VIII).
-- Everything happens inside this transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Sign-up: the auth trigger creates the profile.
insert into auth.users (id, email) values
  ('f0000000-0000-4000-8000-00000000000f', 'triggers@test.invalid'),
  ('f0000000-0000-4000-8000-0000000000f2', 'triggers-other@test.invalid');

select is((select count(*)::int from public.profiles where id = 'f0000000-0000-4000-8000-00000000000f'), 1, 'sign-up creates exactly one profile');
select is((select onboarding_completed from public.profiles where id = 'f0000000-0000-4000-8000-00000000000f'), false, 'the new profile has not completed onboarding');

-- Seed a food (odd values so rounding shows), an alias and a meal as the migration owner.
insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g, source_kind, source_ref)
  values ('test_trg_food', 'Trigger test yemeği', 'dish', 123.45, 10.5, 20.25, 3.33, 100, 'usda', 'test');
insert into public.food_aliases (food_id, alias) values ('test_trg_food', '  Tavuk   Göğsü ');
insert into public.meals (id, user_id, slot, local_date, time_zone, name)
  values ('c0000000-0000-4000-8000-0000000000c1', 'f0000000-0000-4000-8000-00000000000f', 'dinner', '2026-10-11', 'Europe/Istanbul', 'Akşam yemeği');

select is((select alias_normalized from public.food_aliases where food_id = 'test_trg_food'), 'tavuk gogsu', 'normalize_tr still fills the generated search key');

-- A privileged writer (like a later RPC) sends nutrition values and a different owner: both are replaced.
insert into public.meal_items (id, meal_id, user_id, food_id, grams, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
  values ('d0000000-0000-4000-8000-0000000000d1', 'c0000000-0000-4000-8000-0000000000c1', 'f0000000-0000-4000-8000-0000000000f2',
          'test_trg_food', 150, 999, 99, 99, 99);

select results_eq(
  $$select kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g from public.meal_items where id = 'd0000000-0000-4000-8000-0000000000d1'$$,
  $$values (123.45, 10.5, 20.25, 3.33)$$,
  'the item''s per-100 g values are copied from foods, not from the payload');
select is((select user_id from public.meal_items where id = 'd0000000-0000-4000-8000-0000000000d1'), 'f0000000-0000-4000-8000-00000000000f'::uuid, 'the item belongs to the meal''s owner, not to the payload''s user');
select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals where id = 'c0000000-0000-4000-8000-0000000000c1'$$,
  $$values (185.2, 15.8, 30.4, 5.0)$$,
  'inserting an item recomputes the meal totals to one decimal');

-- The owner changes items through the API; totals follow every change.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'f0000000-0000-4000-8000-00000000000f', 'role', 'authenticated')::text, true);

insert into public.meal_items (meal_id, food_id, grams, position) values ('c0000000-0000-4000-8000-0000000000c1', 'test_trg_food', 80, 1);
select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals where id = 'c0000000-0000-4000-8000-0000000000c1'$$,
  $$values (283.9, 24.2, 46.6, 7.7)$$,
  'an item added by the owner is included in the totals');

update public.meal_items set grams = 200 where id = 'd0000000-0000-4000-8000-0000000000d1';
select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals where id = 'c0000000-0000-4000-8000-0000000000c1'$$,
  $$values (345.7, 29.4, 56.7, 9.3)$$,
  'changing an item''s grams recomputes the totals');

delete from public.meal_items where meal_id = 'c0000000-0000-4000-8000-0000000000c1' and position = 1;
select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals where id = 'c0000000-0000-4000-8000-0000000000c1'$$,
  $$values (246.9, 21.0, 40.5, 6.7)$$,
  'deleting an item recomputes the totals');

delete from public.meal_items where id = 'd0000000-0000-4000-8000-0000000000d1';
select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals where id = 'c0000000-0000-4000-8000-0000000000c1'$$,
  $$values (0.0, 0.0, 0.0, 0.0)$$,
  'a meal without items has zero totals');

select throws_ok($$insert into public.meal_items (meal_id, food_id, grams) values ('c0000000-0000-4000-8000-0000000000c1', 'test_trg_food', 0)$$, '23514', null, 'an item of 0 g is rejected');
select throws_ok($$insert into public.meal_items (meal_id, food_id, grams) values ('c0000000-0000-4000-8000-0000000000c1', 'test_trg_food', 5001)$$, '23514', null, 'an item over 5000 g is rejected');

-- Plans: every day at or above the sex floor, macros adding up to the calories, one active plan.
reset role;

select throws_ok(
  $$insert into public.nutrition_plans (user_id, inputs, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g, is_active)
    values ('f0000000-0000-4000-8000-00000000000f', '{"sex": "female"}', 1300, 1600, 1199, 100, 150, 22, false)$$,
  '23514', 'plan_below_floor', 'a plan below 1200 kcal for a woman is rejected');
select throws_ok(
  $$insert into public.nutrition_plans (user_id, inputs, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g, is_active)
    values ('f0000000-0000-4000-8000-00000000000f', '{"sex": "male"}', 1600, 1900, 1499, 120, 180, 33, false)$$,
  '23514', 'plan_below_floor', 'a plan below 1500 kcal for a man is rejected');
select throws_ok(
  $$insert into public.nutrition_plans (user_id, inputs, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g,
                                        training_kcal, training_protein_g, training_carbs_g, training_fat_g,
                                        rest_kcal, rest_protein_g, rest_carbs_g, rest_fat_g, is_active)
    values ('f0000000-0000-4000-8000-00000000000f', '{"sex": "female"}', 1300, 1600, 1300, 100, 150, 33,
            1500, 120, 172, 37, 1150, 100, 120, 30, false)$$,
  '23514', 'plan_below_floor', 'a cycling plan with a rest day below the floor is rejected');
select throws_ok(
  $$insert into public.nutrition_plans (user_id, inputs, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g, is_active)
    values ('f0000000-0000-4000-8000-00000000000f', '{"sex": "female"}', 1300, 1600, 1500, 100, 150, 33, false)$$,
  '23514', 'plan_macros_mismatch', 'a plan whose macros do not add up to its calories is rejected');
select lives_ok(
  $$insert into public.nutrition_plans (user_id, inputs, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g)
    values ('f0000000-0000-4000-8000-00000000000f', '{"sex": "female"}', 1300, 1600, 1200, 100, 150, 22)$$,
  'a plan at exactly the floor is accepted');
select throws_ok(
  $$insert into public.nutrition_plans (user_id, inputs, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g)
    values ('f0000000-0000-4000-8000-00000000000f', '{"sex": "female"}', 1300, 1600, 1300, 100, 150, 33)$$,
  '23505', null, 'a second active plan for the same user is rejected');

-- Function privileges: anon executes nothing in public; authenticated only the RPCs listed here
-- (add each RPC's signature when its migration grants execute).
select is_empty(
  $$select p.oid::regprocedure::text from pg_proc p
     where p.pronamespace = 'public'::regnamespace and has_function_privilege('anon', p.oid, 'execute')$$,
  'anon cannot execute any function in public');
select is_empty(
  $$select p.oid::regprocedure::text from pg_proc p
     where p.pronamespace = 'public'::regnamespace and has_function_privilege('authenticated', p.oid, 'execute')
       and p.oid::regprocedure::text <> all (array['complete_onboarding(jsonb,jsonb)', 'save_plan(jsonb)',
                                                   'search_foods(text,integer)', 'log_meal(meal_slot,date,text,text,jsonb)'])$$,
  'authenticated executes no function in public except the listed RPCs');

create function public.tap_privilege_probe() returns int language sql as $$ select 1 $$;
select ok(
  not has_function_privilege('anon', 'public.tap_privilege_probe()', 'execute')
    and not has_function_privilege('authenticated', 'public.tap_privilege_probe()', 'execute'),
  'a new function in public is not executable by anon or authenticated until granted');

set local role authenticated;
select throws_ok($$select public.check_plan_day('female', 2000, 0, 0, 0)$$, '42501', null, 'a signed-in user cannot call check_plan_day');
select throws_ok($$select public.handle_new_user()$$, '42501', null, 'a signed-in user cannot call handle_new_user');
reset role;
set local role anon;
select throws_ok($$select public.normalize_tr('x')$$, '42501', null, 'an anonymous client cannot call normalize_tr');

reset role;
select * from finish();
rollback;
