-- US3 (T040): log_meal saves a meal with its items in one step; the database computes every number
-- from the food table and ignores nutrition values in the payload (constitution III, FR-013–FR-017).
-- Items are edited and removed through the tables afterwards and the totals follow. Users A and B
-- have finished the setup, C has not. Everything happens inside this transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

insert into auth.users (id, email) values
  ('a4000000-0000-4000-8000-0000000000a4', 'meals-a@test.invalid'),
  ('b4000000-0000-4000-8000-0000000000b4', 'meals-b@test.invalid'),
  ('c4000000-0000-4000-8000-0000000000c4', 'meals-c@test.invalid');
update public.profiles set onboarding_completed = true, time_zone = 'Europe/Istanbul'
 where id in ('a4000000-0000-4000-8000-0000000000a4', 'b4000000-0000-4000-8000-0000000000b4');

-- Two foods with odd values so rounding shows.
insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g) values
  ('test_meal_a', 'Öğün testi A', 'mixed', 123.45, 10.5, 20.25, 3.33, 100),
  ('test_meal_b', 'Öğün testi B', 'mixed', 200, 20, 10, 9, 100);

-- Today in the user's time zone, and a payload that also sends nutrition values the database must ignore.
select set_config('test.today', (now() at time zone 'Europe/Istanbul')::date::text, true);
select set_config('test.items',
  '[{"foodId": "test_meal_a", "grams": 150, "kcal": 9999, "per100g": {"calories": 900, "protein": 100, "carbs": 100, "fat": 100}},
    {"foodId": "test_meal_b", "grams": 80, "totals": {"calories": 1}}]', true);

-- The API surface.
select has_function('public', 'log_meal', array['meal_slot', 'date', 'text', 'text', 'jsonb'], 'log_meal(slot, local_date, time_zone, name, items) exists');

set local role anon;
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'Öğle yemeği', current_setting('test.items')::jsonb)$$,
  '42501', null, 'an anonymous client cannot call log_meal');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'Öğle yemeği', current_setting('test.items')::jsonb)$$,
  '42501', 'not_authenticated', 'log_meal needs a signed-in user');

-- C has not finished the setup.
select set_config('request.jwt.claims', json_build_object('sub', 'c4000000-0000-4000-8000-0000000000c4', 'role', 'authenticated')::text, true);
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'Öğle yemeği', current_setting('test.items')::jsonb)$$,
  '55000', 'onboarding_required', 'logging before the setup is refused');

-- A logs lunch: 150 g of A and 80 g of B.
select set_config('request.jwt.claims', json_build_object('sub', 'a4000000-0000-4000-8000-0000000000a4', 'role', 'authenticated')::text, true);
select set_config('test.meal',
  (select id::text from public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'Öğle yemeği', current_setting('test.items')::jsonb)),
  true);

select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals where id = current_setting('test.meal')::uuid$$,
  $$values (345.2, 31.8, 38.4, 12.2)$$,
  'totals are Σ grams × the food table''s per-100 g values / 100, one decimal; payload values are ignored');
select results_eq(
  $$select user_id, slot, local_date, time_zone, name from public.meals where id = current_setting('test.meal')::uuid$$,
  $$values ('a4000000-0000-4000-8000-0000000000a4'::uuid, 'lunch'::public.meal_slot, current_setting('test.today')::date, 'Europe/Istanbul'::text, 'Öğle yemeği'::text)$$,
  'the meal belongs to the caller and stores the slot, local date, time zone and name');
select results_eq(
  $$select food_id, grams, position, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
      from public.meal_items where meal_id = current_setting('test.meal')::uuid order by position$$,
  $$values ('test_meal_a'::text, 150.0, 0::smallint, 123.45, 10.50, 20.25, 3.33), ('test_meal_b'::text, 80.0, 1::smallint, 200.00, 20.00, 10.00, 9.00)$$,
  'items keep the payload order and copy their per-100 g values from foods');
select results_eq(
  $$select total_kcal from public.log_meal('snack', current_setting('test.today')::date, 'Europe/Istanbul', 'Ara öğün', '[{"foodId": "test_meal_b", "grams": 50}]')$$,
  $$values (100.0)$$,
  'log_meal returns the saved meal with its computed totals');

-- A curated food from the seed migration.
select results_eq(
  $$select m.total_kcal from public.log_meal('dinner', current_setting('test.today')::date, 'Europe/Istanbul', 'Akşam yemeği',
      '[{"foodId": "chicken_breast_grilled", "grams": 200}]') m$$,
  $$select round(200 * kcal_per_100g / 100, 1) from public.foods where id = 'chicken_breast_grilled'$$,
  'a seeded food is logged with the values of the curated food table');

-- Editing grams and removing items recompute the totals.
update public.meal_items set grams = 300 where meal_id = current_setting('test.meal')::uuid and food_id = 'test_meal_a';
select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals where id = current_setting('test.meal')::uuid$$,
  $$values (530.4, 47.5, 68.8, 17.2)$$,
  'changing an item''s grams recomputes the meal totals');
delete from public.meal_items where meal_id = current_setting('test.meal')::uuid and food_id = 'test_meal_b';
select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals where id = current_setting('test.meal')::uuid$$,
  $$values (370.4, 31.5, 60.8, 10.0)$$,
  'removing an item recomputes the meal totals');
select throws_ok(
  $$update public.meal_items set grams = 0 where meal_id = current_setting('test.meal')::uuid$$,
  '23514', null, 'an edit to 0 g is rejected');

-- Refusals, with the codes of contracts/database-api.md.
select set_config('test.meals_before', (select count(*)::text from public.meals), true);
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": 0}]')$$,
  '22023', 'invalid_grams', '0 g is refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": 5001}]')$$,
  '22023', 'invalid_grams', '5001 g is refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": 0.04}]')$$,
  '22023', 'invalid_grams', 'an amount that rounds to 0.0 g is refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": "150"}]')$$,
  '22023', 'invalid_grams', 'grams sent as text are refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a"}]')$$,
  '22023', 'invalid_grams', 'an item without grams is refused');
select lives_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": 5000}]')$$,
  '5000 g is accepted');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '[]')$$,
  '22023', 'no_items', 'a meal without items is refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x',
      (select jsonb_agg(jsonb_build_object('foodId', 'test_meal_a', 'grams', 10)) from generate_series(1, 31)))$$,
  '22023', 'too_many_items', '31 items are refused');
select lives_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x',
      (select jsonb_agg(jsonb_build_object('foodId', 'test_meal_a', 'grams', 10)) from generate_series(1, 30)))$$,
  '30 items are accepted');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '[{"foodId": "no_such_food", "grams": 100}]')$$,
  'P0002', 'unknown_food', 'an unknown food is refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date + 2, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": 100}]')$$,
  '22023', 'date_out_of_range', 'a date two days ahead of the user''s local date is refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date - 2, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": 100}]')$$,
  '22023', 'date_out_of_range', 'a date two days back is refused');
select lives_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date - 1, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": 100}]')$$,
  'yesterday (within ±1 day) is accepted');
select lives_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date + 1, 'Europe/Istanbul', 'x', '[{"foodId": "test_meal_a", "grams": 100}]')$$,
  'tomorrow (within ±1 day) is accepted');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Mars/Olympus', 'x', '[{"foodId": "test_meal_a", "grams": 100}]')$$,
  '22023', 'invalid_meal', 'a time zone the database does not know is refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', '  ', '[{"foodId": "test_meal_a", "grams": 100}]')$$,
  '22023', 'invalid_meal', 'a blank meal name is refused');
select throws_ok(
  $$select public.log_meal('lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x', '{"foodId": "test_meal_a", "grams": 100}')$$,
  '22023', 'invalid_meal', 'items that are not a list are refused');
select is((select count(*)::int from public.meals), current_setting('test.meals_before')::int + 4,
  'refused calls saved nothing (only the four accepted calls added meals)');
select throws_ok(
  $$insert into public.meals (user_id, slot, local_date, time_zone, name)
    values ('a4000000-0000-4000-8000-0000000000a4', 'lunch', current_setting('test.today')::date, 'Europe/Istanbul', 'x')$$,
  '42501', null, 'meals cannot be inserted directly, only through log_meal');

-- B cannot see or change A's meal.
select set_config('request.jwt.claims', json_build_object('sub', 'b4000000-0000-4000-8000-0000000000b4', 'role', 'authenticated')::text, true);
select is_empty($$select 1 from public.meals where id = current_setting('test.meal')::uuid$$, 'B cannot read A''s meal');
select is_empty($$select 1 from public.meal_items where meal_id = current_setting('test.meal')::uuid$$, 'B cannot read A''s meal items');
select is_empty($$update public.meal_items set grams = 1 where meal_id = current_setting('test.meal')::uuid returning 1$$, 'B cannot change A''s item grams');
select is_empty($$delete from public.meals where id = current_setting('test.meal')::uuid returning 1$$, 'B cannot delete A''s meal');

-- A's meal is as A left it, and A can delete it.
reset role;
select results_eq(
  $$select total_kcal, (select count(*)::int from public.meal_items where meal_id = current_setting('test.meal')::uuid)
      from public.meals where id = current_setting('test.meal')::uuid$$,
  $$values (370.4, 1)$$,
  'A''s meal is unchanged by B');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a4000000-0000-4000-8000-0000000000a4', 'role', 'authenticated')::text, true);
delete from public.meals where id = current_setting('test.meal')::uuid;
reset role;
select is_empty($$select 1 from public.meal_items where meal_id = current_setting('test.meal')::uuid$$, 'deleting a meal deletes its items');

select * from finish();
rollback;
