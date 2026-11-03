-- Portion shortcuts (spec 002 FR-007): every meat, poultry and fish food offers at least one unit
-- portion (food list 5, grams from FDC SR/Foundation and FNDDS portion weights). Nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);

select is_empty(
  $$select f.id from public.foods f
     where f.category in ('meat', 'poultry', 'fish') and f.searchable
       and not exists (select 1 from public.food_portions p where p.food_id = f.id)$$,
  'every meat, poultry and fish food has a portion');

select * from finish();
rollback;
