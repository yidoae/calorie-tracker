-- 002 part A: 20261015000100_food_schema.sql only granted select on food_portions, but Supabase's
-- default privileges had already given anon and authenticated everything on the new table. Same
-- pattern as 20261009000100_schema.sql: nothing for anonymous clients, read-only when signed in.
revoke all on public.food_portions from anon, authenticated;
grant select on public.food_portions to authenticated;
