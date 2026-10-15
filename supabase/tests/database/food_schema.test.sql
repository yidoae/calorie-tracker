-- 002 (T004): the food schema of part A (data-model.md, contracts/database-api.md): alcohol and
-- required source columns on foods, the food_portions table under RLS (filled from the old
-- unit_weights), and search_foods returning the
-- portions and hiding foods that are not searchable. Everything happens inside this transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- New and dropped columns.
select col_type_is('public', 'foods', 'alcohol_per_100g', 'numeric(6,2)', 'foods.alcohol_per_100g is numeric(6,2)');
select col_default_is('public', 'foods', 'alcohol_per_100g', '0', 'alcohol defaults to 0');
select col_not_null('public', 'foods', 'source_kind', 'foods.source_kind is required');
select col_not_null('public', 'foods', 'source_ref', 'foods.source_ref is required');
select col_default_is('public', 'foods', 'searchable', 'true', 'foods are offered in search by default');
select hasnt_column('public', 'foods', 'unit_weights', 'foods.unit_weights is gone (replaced by food_portions)');

insert into auth.users (id, email) values ('a4000000-0000-4000-8000-0000000000a4', 'portions-a@test.invalid');
insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g, source_kind, source_ref) values
  ('test_fs_egg', 'Kumkuat yumurtası', 'egg', 143, 12.6, 0.7, 9.5, 50, 'usda', 'FDC 1 (test)'),
  ('test_fs_gone', 'Kumkuat ezmesi', 'sweet', 300, 1, 70, 1, 20, 'label', 'label:test, 2026-10-15');
insert into public.food_aliases (food_id, alias) values ('test_fs_egg', 'kumkuat yumurtası'), ('test_fs_gone', 'kumkuat ezmesi');

-- Column checks.
select throws_ok($$update public.foods set alcohol_per_100g = 101 where id = 'test_fs_egg'$$, '23514', null, 'alcohol is at most 100 g per 100 g');
select throws_ok($$update public.foods set source_kind = 'turkomp' where id = 'test_fs_egg'$$, '23514', null, 'source_kind is usda, recipe or label');
select throws_ok($$update public.foods set source_ref = '' where id = 'test_fs_egg'$$, '23514', null, 'source_ref is not empty');
select throws_ok($$update public.foods set category = 'mixed' where id = 'test_fs_egg'$$, '23514', null, 'the 001 category "mixed" is not allowed');
select lives_ok($$update public.foods set category = 'dish' where id = 'test_fs_gone'$$, 'the new category "dish" is allowed');
select lives_ok($$update public.foods set category = 'other' where id = 'test_fs_gone'$$, 'release 1''s category "other" is allowed');
select throws_ok($$update public.foods set source_kind = null where id = 'test_fs_egg'$$, '23502', null, 'source_kind is required');

-- Release 1's unit weights became Turkish-labelled portions.
select ok((select count(*) > 0 from public.food_portions where food_id not like 'test_%'), 'the old unit weights were moved to food_portions');
select is((select count(*)::int from public.food_portions where unit ~ '[A-Z]' or unit in ('avuc', 'olcek')), 0, 'no camelCase or ASCII unit label is left');

-- food_portions: shape and checks.
select col_is_pk('public', 'food_portions', array['food_id', 'unit'], 'food_portions is keyed by food and unit');
insert into public.food_portions (food_id, unit, grams, position) values
  ('test_fs_egg', 'kase', 200, 1),
  ('test_fs_egg', 'adet', 50, 0);
select throws_ok($$insert into public.food_portions (food_id, unit, grams, position) values ('test_fs_egg', 'dilim', 0, 2)$$, '23514', null, 'a portion weighs more than 0 g');
select throws_ok($$insert into public.food_portions (food_id, unit, grams, position) values ('test_fs_egg', 'dilim', 5001, 2)$$, '23514', null, 'a portion weighs at most 5000 g');

-- A saved meal that uses the food that will leave search.
insert into public.meals (id, user_id, slot, local_date, time_zone, name)
  values ('c4000000-0000-4000-8000-0000000000c4', 'a4000000-0000-4000-8000-0000000000a4', 'snack', '2026-10-15', 'Europe/Istanbul', 'Test öğünü');
insert into public.meal_items (meal_id, food_id, grams) values ('c4000000-0000-4000-8000-0000000000c4', 'test_fs_gone', 40);
update public.foods set searchable = false where id = 'test_fs_gone';

-- RLS: anonymous sees nothing, a signed-in user reads but never writes.
set local role anon;
select throws_ok($$select * from public.food_portions$$, '42501', null, 'an anonymous client cannot read food_portions');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a4000000-0000-4000-8000-0000000000a4', 'role', 'authenticated')::text, true);
select is((select count(*)::int from public.food_portions where food_id = 'test_fs_egg'), 2, 'a signed-in user reads the portions');
select throws_ok($$insert into public.food_portions (food_id, unit, grams, position) values ('test_fs_egg', 'dilim', 30, 2)$$, '42501', null, 'a signed-in user cannot add a portion');
select throws_ok($$update public.food_portions set grams = 1 where food_id = 'test_fs_egg'$$, '42501', null, 'a signed-in user cannot change a portion');
select throws_ok($$delete from public.food_portions where food_id = 'test_fs_egg'$$, '42501', null, 'a signed-in user cannot delete a portion');

-- search_foods: portions in position order, [] without portions, foods out of search hidden.
select is(
  (select portions from public.search_foods('kumkuat yumurtası') where food_id = 'test_fs_egg'),
  '[{"unit": "adet", "grams": 50.0}, {"unit": "kase", "grams": 200.0}]'::jsonb,
  'search returns the portions ordered by position');
select is(
  (select count(*)::int from public.search_foods('kumkuat ezmesi') where food_id = 'test_fs_gone'), 0,
  'a food that is not searchable is not returned by search');
select is(
  (select f.name_tr from public.meal_items i join public.foods f on f.id = i.food_id
    where i.meal_id = 'c4000000-0000-4000-8000-0000000000c4'),
  'Kumkuat ezmesi',
  'a food that left search stays readable in the meals that use it (FR-010)');

reset role;
delete from public.food_portions where food_id = 'test_fs_egg';
set local role authenticated;
select is(
  (select portions from public.search_foods('kumkuat yumurtası') where food_id = 'test_fs_egg'),
  '[]'::jsonb,
  'a food without portions comes back with an empty list');

select * from finish();
rollback;
