-- Constitution VIII / SC-005: a user never reads or changes another user's rows, anonymous clients
-- read nothing, the shared food tables are read-only and the app cannot write server-owned columns.
-- Users A and B exist only inside this transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

-- Seed as the migration owner: two accounts, a food with an alias, and A's meal, item and plan.
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-00000000000a', 'rls-a@test.invalid'),
  ('b0000000-0000-4000-8000-00000000000b', 'rls-b@test.invalid');
insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g, source_kind, source_ref)
  values ('test_rls_food', 'RLS test yemeği', 'dish', 100, 10, 10, 2.2, 100, 'usda', 'test');
insert into public.food_aliases (food_id, alias) values ('test_rls_food', 'rls test');
insert into public.meals (id, user_id, slot, local_date, time_zone, name)
  values ('c0000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-00000000000a', 'lunch', '2026-10-09', 'Europe/Istanbul', 'Test öğünü');
insert into public.meal_items (id, meal_id, food_id, grams)
  values ('d0000000-0000-4000-8000-00000000000d', 'c0000000-0000-4000-8000-00000000000c', 'test_rls_food', 150);
insert into public.nutrition_plans (id, user_id, inputs, bmr, tdee, base_kcal, base_protein_g, base_carbs_g, base_fat_g)
  values ('e0000000-0000-4000-8000-00000000000e', 'a0000000-0000-4000-8000-00000000000a', '{"sex": "female"}', 1400, 1700, 1300, 100, 150, 33);

-- User B: sees and changes nothing of A's.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b0000000-0000-4000-8000-00000000000b', 'role', 'authenticated')::text, true);

select results_eq($$select id from public.profiles$$, $$values ('b0000000-0000-4000-8000-00000000000b'::uuid)$$, 'B sees only their own profile');
select is_empty($$select 1 from public.nutrition_plans$$, 'B sees no plans of others');
select is_empty($$select 1 from public.meals$$, 'B sees no meals of others');
select is_empty($$select 1 from public.meal_items$$, 'B sees no meal items of others');

select is_empty($$update public.profiles set height_cm = 200 where id = 'a0000000-0000-4000-8000-00000000000a' returning 1$$, 'B cannot update A''s profile');
select throws_ok($$update public.nutrition_plans set summary = 'x' where id = 'e0000000-0000-4000-8000-00000000000e'$$, '42501', null, 'B cannot update A''s plan (plans are written by RPCs only)');
select is_empty($$update public.meals set name = 'ele geçirildi' where id = 'c0000000-0000-4000-8000-00000000000c' returning 1$$, 'B cannot update A''s meal');
select is_empty($$update public.meal_items set grams = 1 where id = 'd0000000-0000-4000-8000-00000000000d' returning 1$$, 'B cannot update A''s meal item');

select throws_ok($$delete from public.profiles where id = 'a0000000-0000-4000-8000-00000000000a'$$, '42501', null, 'B cannot delete A''s profile (nobody deletes profiles through the API)');
select throws_ok($$delete from public.nutrition_plans where id = 'e0000000-0000-4000-8000-00000000000e'$$, '42501', null, 'B cannot delete A''s plan');
select is_empty($$delete from public.meals where id = 'c0000000-0000-4000-8000-00000000000c' returning 1$$, 'B cannot delete A''s meal');
select is_empty($$delete from public.meal_items where id = 'd0000000-0000-4000-8000-00000000000d' returning 1$$, 'B cannot delete A''s meal item');

select throws_ok(
  $$insert into public.meal_items (meal_id, food_id, grams) values ('c0000000-0000-4000-8000-00000000000c', 'test_rls_food', 100)$$,
  'P0002', 'meal_not_found', 'B cannot add an item to A''s meal');

-- A's rows are untouched.
reset role;
select is((select name from public.meals where id = 'c0000000-0000-4000-8000-00000000000c'), 'Test öğünü', 'A''s meal is unchanged');
select results_eq($$select grams from public.meal_items where meal_id = 'c0000000-0000-4000-8000-00000000000c'$$, $$values (150.0)$$, 'A''s meal still has its one item of 150 g');
select is((select height_cm from public.profiles where id = 'a0000000-0000-4000-8000-00000000000a'), null, 'A''s profile is unchanged');
select is((select count(*)::int from public.nutrition_plans where user_id = 'a0000000-0000-4000-8000-00000000000a'), 1, 'A''s plan still exists');

-- User A: sees their own rows with server-computed totals, cannot write server-owned columns.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-4000-8000-00000000000a', 'role', 'authenticated')::text, true);

select results_eq($$select id from public.profiles$$, $$values ('a0000000-0000-4000-8000-00000000000a'::uuid)$$, 'A sees only their own profile');
select results_eq($$select id from public.nutrition_plans$$, $$values ('e0000000-0000-4000-8000-00000000000e'::uuid)$$, 'A sees their plan');
select results_eq(
  $$select total_kcal, total_protein_g, total_carbs_g, total_fat_g from public.meals$$,
  $$values (150.0, 15.0, 15.0, 3.3)$$,
  'A sees their meal with totals computed from its item');
select results_eq($$select id from public.meal_items$$, $$values ('d0000000-0000-4000-8000-00000000000d'::uuid)$$, 'A sees their meal item');

select throws_ok($$update public.meals set total_kcal = 1 where id = 'c0000000-0000-4000-8000-00000000000c'$$, '42501', null, 'the app cannot write meal totals');
select throws_ok(
  $$insert into public.meal_items (meal_id, food_id, grams, kcal_per_100g) values ('c0000000-0000-4000-8000-00000000000c', 'test_rls_food', 10, 1)$$,
  '42501', null, 'the app cannot send per-100 g values with a new item');
select throws_ok($$update public.meal_items set kcal_per_100g = 1 where id = 'd0000000-0000-4000-8000-00000000000d'$$, '42501', null, 'the app cannot change an item''s per-100 g values');
select throws_ok($$update public.profiles set onboarding_completed = true where id = 'a0000000-0000-4000-8000-00000000000a'$$, '42501', null, 'the app cannot set onboarding_completed');

-- The shared food tables: readable when signed in, never writable through the API.
select results_eq($$select id from public.foods where id = 'test_rls_food'$$, $$values ('test_rls_food'::text)$$, 'signed-in users read foods');
select results_eq($$select alias from public.food_aliases where food_id = 'test_rls_food'$$, $$values ('rls test'::text)$$, 'signed-in users read food aliases');
select throws_ok(
  $$insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g, source_kind, source_ref)
    values ('hack', 'x', 'dish', 1, 0, 0, 0, 1, 'usda', 'test')$$,
  '42501', null, 'signed-in users cannot add foods');
select throws_ok($$update public.foods set kcal_per_100g = 1 where id = 'test_rls_food'$$, '42501', null, 'signed-in users cannot change foods');
select throws_ok($$delete from public.foods where id = 'test_rls_food'$$, '42501', null, 'signed-in users cannot delete foods');
select throws_ok($$insert into public.food_aliases (food_id, alias) values ('test_rls_food', 'hack')$$, '42501', null, 'signed-in users cannot add food aliases');

-- Anonymous clients: no access to any table.
reset role;
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

select throws_ok($$select 1 from public.profiles$$, '42501', null, 'anonymous clients cannot read profiles');
select throws_ok($$select 1 from public.nutrition_plans$$, '42501', null, 'anonymous clients cannot read plans');
select throws_ok($$select 1 from public.meals$$, '42501', null, 'anonymous clients cannot read meals');
select throws_ok($$select 1 from public.meal_items$$, '42501', null, 'anonymous clients cannot read meal items');
select throws_ok($$select 1 from public.foods$$, '42501', null, 'anonymous clients cannot read foods');
select throws_ok($$select 1 from public.food_aliases$$, '42501', null, 'anonymous clients cannot read food aliases');
select throws_ok(
  $$insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g, source_kind, source_ref)
    values ('hack', 'x', 'dish', 1, 0, 0, 0, 1, 'usda', 'test')$$,
  '42501', null, 'anonymous clients cannot add foods');

reset role;
select * from finish();
rollback;
