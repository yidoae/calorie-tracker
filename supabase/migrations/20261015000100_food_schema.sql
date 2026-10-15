-- 002 part A (T007): the food schema on top of 20261014000100_food_sources.sql and the 118 foods of
-- 20261014000200_food_release_1.sql (data-model.md, contracts/database-api.md). Adds alcohol, makes
-- the source columns required, restores a category check for the 002 groups, moves unit portions
-- from foods.unit_weights to their own ordered table, and makes search return the portions and skip
-- foods that left the list (searchable = false). Later lists ship as generated
-- `*_food_list_<n>.sql` migrations from tools/fooddata.

-- Alcohol energy is inside kcal; the gram value lets the build check kcal against the macros.
alter table public.foods
  add column alcohol_per_100g numeric(6, 2) not null default 0 check (alcohol_per_100g between 0 and 100);

-- Release 1 filled both source columns for every food; from now on they are required.
alter table public.foods
  alter column source_kind set not null,
  alter column source_ref set not null,
  add constraint foods_source_kind_check check (source_kind in ('usda', 'recipe', 'label'));

-- The 002 groups (FR-001); release 1 already uses only these, so the check is validated at once.
alter table public.foods add constraint foods_category_check check (category in (
  'meat', 'poultry', 'fish', 'egg', 'dairy', 'legume', 'grain', 'bread', 'vegetable', 'fruit',
  'nut_seed', 'oil', 'sweet', 'drink', 'alcohol', 'dish', 'other'
));

create table public.food_portions (
  food_id text not null references public.foods (id) on delete cascade,
  unit text not null check (char_length(unit) between 1 and 30),
  grams numeric(6, 1) not null check (grams > 0 and grams <= 5000),
  position smallint not null default 0 check (position >= 0),
  primary key (food_id, unit)
);

alter table public.food_portions enable row level security;
create policy "food portions: read" on public.food_portions for select to authenticated using (true);
grant select on public.food_portions to authenticated;

-- unit_weights keys were camelCase ASCII; the chips show Turkish labels, lightest first.
insert into public.food_portions (food_id, unit, grams, position)
select f.id,
       case w.key
         when 'avuc' then 'avuç'
         when 'cayKasigi' then 'çay kaşığı'
         when 'olcek' then 'ölçek'
         when 'suBardagi' then 'su bardağı'
         when 'yemekKasigi' then 'yemek kaşığı'
         else w.key
       end,
       w.value::numeric,
       (row_number() over (partition by f.id order by w.value::numeric, w.key) - 1)::smallint
  from public.foods f, jsonb_each_text(f.unit_weights) as w(key, value);

alter table public.foods drop column unit_weights;

-- search_foods gains `portions` (a new return column, so drop and recreate) and skips foods that
-- are not searchable. Ranking and errors are those of 20261011000300_search.sql.
drop function public.search_foods(text, int);
drop function private.search_foods(text, int);

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
  portions jsonb,
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
             when position(' ' || a.alias_normalized || ' ' in ' ' || nq || ' ') > 0
               then 3 + char_length(a.alias_normalized) / 100.0
             when starts_with(a.alias_normalized, nq) or exists (select 1 from terms where starts_with(a.alias_normalized, terms.term))
               then 2 + extensions.similarity(a.alias_normalized, nq)
             else greatest(
               extensions.similarity(a.alias_normalized, nq),
               (select max(extensions.similarity(a.alias_normalized, terms.term)) from terms)
             )
           end as rank_score
      from public.food_aliases a
      join public.foods f on f.id = a.food_id
     where f.searchable
  ),
  best as (
    select distinct on (s.fid) s.fid, s.alias_text, s.rank_score
      from scored s
     where s.rank_score >= 0.3
     order by s.fid, s.rank_score desc, char_length(s.alias_text), s.alias_text
  )
  select f.id, f.name_tr, b.alias_text, f.typical_portion_g,
         f.kcal_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g,
         coalesce(
           (select jsonb_agg(jsonb_build_object('unit', p.unit, 'grams', p.grams) order by p.position, p.unit)
              from public.food_portions p
             where p.food_id = f.id),
           '[]'::jsonb),
         b.rank_score::real
    from best b
    join public.foods f on f.id = b.fid
   order by b.rank_score desc, f.name_tr
   limit least(max_results, 50);
end;
$$;

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
  portions jsonb,
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
