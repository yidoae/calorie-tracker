-- The owner weighs food raw (2026-10-11): a bare staple name finds the raw/dry food first, the
-- cooked food stays findable by its own name, and every food's name says which state its values
-- are for where both exist. Everything happens inside this transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (id, email) values ('a4000000-0000-4000-8000-0000000000a4', 'raw-a@test.invalid');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a4000000-0000-4000-8000-0000000000a4', 'role', 'authenticated')::text, true);

-- A bare name finds the raw or dry food first.
select is((select food_id from public.search_foods('pirinç') limit 1), 'rice_raw', '"pirinç" finds raw rice first');
select is((select food_id from public.search_foods('makarna') limit 1), 'pasta_dry', '"makarna" finds dry pasta first');
select is((select food_id from public.search_foods('bulgur') limit 1), 'bulgur_dry', '"bulgur" finds dry bulgur first');
select is((select food_id from public.search_foods('mercimek') limit 1), 'lentils_dry', '"mercimek" finds dry lentils first');
select is((select food_id from public.search_foods('kıyma') limit 1), 'beef_mince_raw', '"kıyma" finds raw mince first');
select is((select food_id from public.search_foods('et') limit 1), 'beef_raw', '"et" finds raw beef first');
select is((select food_id from public.search_foods('dana eti') limit 1), 'beef_raw', '"dana eti" finds raw beef first');
select is((select food_id from public.search_foods('patates') limit 1), 'potato_raw', '"patates" finds raw potato first');
select is((select food_id from public.search_foods('tavuk but') limit 1), 'chicken_thigh_raw', '"tavuk but" finds raw chicken thigh first');
select is((select food_id from public.search_foods('tavuk göğsü') limit 1), 'chicken_breast_raw', '"tavuk göğsü" finds raw chicken breast first');

-- The cooked foods are still found by their own names, and listed under the bare name too.
select is((select food_id from public.search_foods('pirinç pilavı') limit 1), 'white_rice', '"pirinç pilavı" still finds cooked rice');
select is((select food_id from public.search_foods('ızgara tavuk') limit 1), 'chicken_breast_grilled', '"ızgara tavuk" still finds grilled chicken');
select ok(exists (select 1 from public.search_foods('pirinç') where food_id = 'white_rice'), 'cooked rice is also listed for "pirinç"');

-- Plausible raw values: dry staples far denser than their cooked forms, macros adding up.
-- white_rice is release 1's pilav recipe (cooked with fat), so the ratio is lower than for boiled rice.
select ok((select kcal_per_100g from public.foods where id = 'rice_raw') > 2 * (select kcal_per_100g from public.foods where id = 'white_rice'),
  'raw rice has more than 2× the kcal of rice pilav per 100 g');
select ok((select kcal_per_100g from public.foods where id = 'pasta_dry') > 2 * (select kcal_per_100g from public.foods where id = 'spaghetti'),
  'dry pasta has more than 2× the kcal of cooked pasta per 100 g');
select is_empty(
  $$select id from public.foods
     where id in ('rice_raw', 'pasta_dry', 'bulgur_dry', 'lentils_dry', 'beef_mince_raw', 'beef_mince_lean_raw', 'beef_raw', 'potato_raw', 'chicken_thigh_raw')
       and abs(4 * protein_per_100g + 4 * carbs_per_100g + 9 * fat_per_100g - kcal_per_100g) > 0.1 * kcal_per_100g$$,
  'the new raw foods'' macros add up to their kcal within 10 %');

-- Names say the state where a raw and a cooked food share a staple.
select is_empty(
  $$select id from public.foods
     where id in ('white_rice', 'spaghetti', 'bulgur', 'lentils', 'potato', 'steak')
       and name_tr !~ '\((pişmiş|haşlanmış)\)'$$,
  'the cooked staples say (pişmiş) or (haşlanmış) in their names');
select is_empty(
  $$select id from public.foods
     where id in ('rice_raw', 'pasta_dry', 'bulgur_dry', 'lentils_dry', 'beef_mince_raw', 'beef_mince_lean_raw', 'beef_raw', 'potato_raw', 'chicken_thigh_raw', 'chicken_breast_raw')
       and name_tr !~ '\((çiğ|kuru)'$$,
  'the raw staples say (çiğ…) or (kuru) in their names');

reset role;
select is((select count(*)::int from public.foods where id !~ '^test_'), 461, 'the curated list has food list 2''s 461 foods');

select * from finish();
rollback;
