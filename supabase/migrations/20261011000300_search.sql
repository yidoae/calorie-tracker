-- 001 US3: food search (contracts/database-api.md, FR-012, research.md §8).
-- search_foods(q, max_results) ranks the food aliases against the query: an alias that appears in
-- the query as whole words, then an alias that starts with the query or one of its words, then
-- trigram similarity ≥ 0.3; one row per food (its best alias), at most 50. The app sends the typed
-- words plus their suffix candidates from core searchStems ("tavuğu tavuk"); normalize_tr folds
-- both sides. The body runs as the owner in `private` because normalize_tr is not executable by
-- the API roles (20261011000100_function_privileges.sql); it reads only the shared food tables,
-- which every signed-in user may read. The public function is a security invoker entry point, as
-- in 20261011000200_onboarding_rpcs.sql. With about 80 curated foods a scan of the aliases is
-- cheap; feature 002 (a large food table) should filter through the trigram index first.

create function private.search_foods(q text, max_results int)
returns table (
  food_id text,
  name_tr text,
  matched_alias text,
  typical_portion_g numeric,
  kcal_per_100g numeric,
  protein_per_100g numeric,
  carbs_per_100g numeric,
  fat_per_100g numeric,
  score real
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  nq text := public.normalize_tr(q);
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if q is null or char_length(q) not between 1 and 60 or nq = '' or max_results is null or max_results < 1 then
    raise exception 'invalid_query' using errcode = '22023';
  end if;

  return query
  with terms as (
    select distinct t.term from regexp_split_to_table(nq, ' ') as t(term)
  ),
  scored as (
    select a.food_id as fid,
           a.alias as alias_text,
           case
             -- Exact: the alias is a run of whole words of the query; a longer alias is more specific.
             when position(' ' || a.alias_normalized || ' ' in ' ' || nq || ' ') > 0
               then 3 + char_length(a.alias_normalized) / 100.0
             -- Prefix: the alias starts with the query or with one of its words.
             when starts_with(a.alias_normalized, nq) or exists (select 1 from terms where starts_with(a.alias_normalized, terms.term))
               then 2 + extensions.similarity(a.alias_normalized, nq)
             -- Similar spelling, against the whole query or its best word.
             else greatest(
               extensions.similarity(a.alias_normalized, nq),
               (select max(extensions.similarity(a.alias_normalized, terms.term)) from terms)
             )
           end as rank_score
      from public.food_aliases a
  ),
  best as (
    select distinct on (s.fid) s.fid, s.alias_text, s.rank_score
      from scored s
     where s.rank_score >= 0.3
     order by s.fid, s.rank_score desc, char_length(s.alias_text), s.alias_text
  )
  select f.id, f.name_tr, b.alias_text, f.typical_portion_g,
         f.kcal_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
         b.rank_score::real
    from best b
    join public.foods f on f.id = b.fid
   order by b.rank_score desc, f.name_tr
   limit least(max_results, 50);
end;
$$;

-- The API: POST /rest/v1/rpc/search_foods.
create function public.search_foods(q text, max_results int default 20)
returns table (
  food_id text,
  name_tr text,
  matched_alias text,
  typical_portion_g numeric,
  kcal_per_100g numeric,
  protein_per_100g numeric,
  carbs_per_100g numeric,
  fat_per_100g numeric,
  score real
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.search_foods(q, max_results)
$$;

revoke execute on function private.search_foods(text, int), public.search_foods(text, int) from public, anon;
grant execute on function private.search_foods(text, int), public.search_foods(text, int) to authenticated;
