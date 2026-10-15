-- US3 (T041): search_foods finds foods by Turkish text, tolerant of case, Turkish letters and the
-- suffix candidates the app adds (FR-012, research.md §8). normalize_tr equals core normalizeTr on
-- the fixture pairs (packages/core/tests/fixtures/normalize-tr.json; packages/core/tests/
-- normalize.test.ts fails when a pair is missing here). Everything happens inside this
-- transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, email) values ('a3000000-0000-4000-8000-0000000000a3', 'search-a@test.invalid');

-- Made-up foods, so the curated seed cannot interfere with the ranking checks: one alias equal to
-- the query, one starting with it, one only similar (trigram similarity 0.5), one unrelated.
insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g, source_kind, source_ref) values
  ('test_srch_exact', 'Kumkuat', 'fruit', 71, 1.9, 15.9, 0.9, 100, 'usda', 'test'),
  ('test_srch_prefix', 'Kumkuatlı tart', 'dish', 300, 4, 40, 14, 120, 'usda', 'test'),
  ('test_srch_trgm', 'Kumkat reçeli', 'fruit', 250, 0.3, 62, 0.1, 20, 'usda', 'test'),
  ('test_srch_other', 'Zerdeçal', 'dish', 312, 9.7, 67, 3.3, 5, 'usda', 'test');
insert into public.food_aliases (food_id, alias) values
  ('test_srch_exact', 'kumkuat', 'usda', 'test'),
  ('test_srch_exact', 'kumkuat taze', 'usda', 'test'),
  ('test_srch_prefix', 'kumkuatlı tart', 'usda', 'test'),
  ('test_srch_trgm', 'kumkat', 'usda', 'test'),
  ('test_srch_other', 'zerdeçal', 'usda', 'test');
-- Sixty foods that all start with the same word, for the result caps.
insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g, source_kind, source_ref)
  select 'test_srch_cap_' || i, 'Kapaklı ' || i, 'dish', 100, 1, 1, 1, 100, 'usda', 'test' from generate_series(1, 60) i;
insert into public.food_aliases (food_id, alias) select 'test_srch_cap_' || i, 'kapaklı ' || i from generate_series(1, 60) i;

-- The API surface.
select has_function('public', 'search_foods', array['text', 'integer'], 'search_foods(q, max_results) exists');

set local role anon;
select throws_ok($$select * from public.search_foods('tavuk')$$, '42501', null, 'an anonymous client cannot call search_foods');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);
select throws_ok($$select * from public.search_foods('tavuk')$$, '42501', 'not_authenticated', 'search_foods needs a signed-in user');

select set_config('request.jwt.claims', json_build_object('sub', 'a3000000-0000-4000-8000-0000000000a3', 'role', 'authenticated')::text, true);

-- Ranking: exact alias, then prefix, then trigram similarity ≥ 0.3; unrelated foods stay out.
select results_eq(
  $$select food_id from public.search_foods('kumkuat')$$,
  $$values ('test_srch_exact'), ('test_srch_prefix'), ('test_srch_trgm')$$,
  'exact alias first, then the prefix match, then the similar spelling; nothing unrelated');
select ok(
  (select bool_and(s.score > n.score)
     from (select score, row_number() over () as k from public.search_foods('kumkuat')) s
     join (select score, row_number() over () as k from public.search_foods('kumkuat')) n on n.k = s.k + 1),
  'scores fall strictly from exact to prefix to trigram');
select is(
  (select count(*)::int from public.search_foods('kumkuat') where food_id = 'test_srch_exact'), 1,
  'a food with several matching aliases comes back once');
select is(
  (select matched_alias from public.search_foods('kumkuat') where food_id = 'test_srch_exact'), 'kumkuat',
  'the row carries the best matching alias');
select results_eq(
  $$select name_tr, typical_portion_g, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
      from public.search_foods('kumkuat') where food_id = 'test_srch_exact'$$,
  $$values ('Kumkuat'::text, 100.0, 71.00, 1.90, 15.90, 0.90)$$,
  'a result carries the food''s name, typical portion and values per 100 g');
select is(
  (select food_id from public.search_foods('KUMKUATLI') limit 1), 'test_srch_prefix',
  'upper-case Turkish input (dotless I) is folded before matching');
select is(
  (select food_id from public.search_foods('  Kumkuat  ') limit 1), 'test_srch_exact',
  'surrounding spaces and case do not matter');
select is_empty($$select 1 from public.search_foods('zzqqxx')$$, 'a query that matches nothing returns no rows');

-- The curated foods: suffixed Turkish finds the chicken (the app sends "tavuğu" plus its stem).
-- Bare names find the raw food first: the owner weighs food raw (raw_weights.test.sql).
select is((select food_id from public.search_foods('tavuğu tavuk') limit 1), 'chicken_breast_raw', 'search_foods(''tavuğu tavuk'') returns the chicken first');
select is((select food_id from public.search_foods('tavuk göğsü') limit 1), 'chicken_breast_raw', '"tavuk göğsü" returns the chicken first');
select is((select food_id from public.search_foods('mercimek çorbası çorba') limit 1), 'lentil_soup', 'a two-word dish name returns that dish first');

-- Caps: max_results defaults to 20 and never exceeds 50.
select is((select count(*)::int from public.search_foods('kapaklı')), 20, 'twenty results by default');
select is((select count(*)::int from public.search_foods('kapaklı', 500)), 50, 'at most fifty results, whatever max_results says');
select is((select count(*)::int from public.search_foods('kapaklı', 5)), 5, 'max_results below the cap is honoured');

-- The query must be 1–60 characters with something to search for.
select throws_ok($$select * from public.search_foods('')$$, '22023', 'invalid_query', 'an empty query is refused');
select throws_ok($$select * from public.search_foods('   ')$$, '22023', 'invalid_query', 'a blank query is refused');
select throws_ok($$select * from public.search_foods(repeat('a', 61))$$, '22023', 'invalid_query', 'a query over 60 characters is refused');
select lives_ok($$select * from public.search_foods(repeat('a', 60))$$, 'a query of 60 characters is accepted');
select throws_ok($$select * from public.search_foods(null)$$, '22023', 'invalid_query', 'a missing query is refused');
select throws_ok($$select * from public.search_foods('tavuk', 0)$$, '22023', 'invalid_query', 'max_results below 1 is refused');

-- Parity with core normalizeTr: the same pairs as packages/core/tests/fixtures/normalize-tr.json.
reset role;
select is_empty(
  $$select input, public.normalize_tr(input), expected from (values
    ('İSTANBUL', 'istanbul'),
    ('ISPANAK', 'ispanak'),
    ('ıspanak', 'ispanak'),
    ('Tavuk Göğsü', 'tavuk gogsu'),
    ('ÇİĞ KÖFTE', 'cig kofte'),
    ('Şekerli Üzüm', 'sekerli uzum'),
    ('  Mercimek   çorbası ', 'mercimek corbasi'),
    ('tavuğu', 'tavugu'),
    ('Kâse', 'kase'),
    ('Îmâm bayıldı', 'imam bayildi'),
    ('Ûsküdar', 'uskudar'),
    (E'süt\tve\nbal', 'sut ve bal'),
    (E'beyaz\u00a0peynir', 'beyaz peynir'),
    ('CAFÉ Ñ', 'café ñ'),
    ('Ayran 200 ml', 'ayran 200 ml'),
    ('', ''),
    ('   ', '')
  ) as pair(input, expected) where public.normalize_tr(input) is distinct from expected$$,
  'normalize_tr equals core normalizeTr on every fixture pair');

select * from finish();
rollback;
