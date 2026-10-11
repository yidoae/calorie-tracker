-- 001 US3: log a meal with its items in one step (contracts/database-api.md, FR-013–FR-016).
-- log_meal(slot, local_date, time_zone, name, items) inserts the meal and its items in one
-- transaction, so a meal never exists without items. Items carry only `foodId` and `grams` (core
-- logMealPayloadSchema's camelCase keys); the meal_items_prepare trigger copies the per-100 g
-- values from foods and meal_items_totals computes the totals, so any nutrition the payload sends
-- is ignored (constitution III, FR-015). Authenticated users cannot insert meals directly, so the
-- body runs as the owner in `private` behind a security invoker entry point in `public`
-- (20261011000200_onboarding_rpcs.sql). Errors raise a stable code as the message.

create function private.log_meal(slot public.meal_slot, local_date date, time_zone text, name text, items jsonb)
returns public.meals
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  completed boolean;
  today date;
  item_count int;
  new_meal uuid;
  saved public.meals;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  select p.onboarding_completed into completed from public.profiles p where p.id = uid;
  if not coalesce(completed, false) then
    raise exception 'onboarding_required' using errcode = '55000';
  end if;

  -- The meal: a slot and a date, a name of 1–80 characters, an IANA time zone the database knows
  -- (the core timeZoneSchema pattern), and a list of items.
  if log_meal.slot is null or log_meal.local_date is null
     or coalesce(char_length(btrim(log_meal.name)), 0) not between 1 and 80
     or coalesce(char_length(log_meal.time_zone), 0) not between 1 and 64
     or log_meal.time_zone !~ '^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+)*$'
     or jsonb_typeof(items) is distinct from 'array' then
    raise exception 'invalid_meal' using errcode = '22023';
  end if;
  begin
    today := (now() at time zone log_meal.time_zone)::date;
  exception when invalid_parameter_value then
    raise exception 'invalid_meal' using errcode = '22023';
  end;
  -- FR-016: the user's local date, give or take a day (travel, logging just after midnight).
  if log_meal.local_date not between today - 1 and today + 1 then
    raise exception 'date_out_of_range' using errcode = '22023';
  end if;

  item_count := jsonb_array_length(items);
  if item_count = 0 then
    raise exception 'no_items' using errcode = '22023';
  end if;
  if item_count > 30 then
    raise exception 'too_many_items' using errcode = '22023';
  end if;
  -- FR-013: more than 0 and at most 5000 g, still more than 0 at the column's one decimal.
  if exists (
    select 1 from jsonb_array_elements(items) as i(v)
     where not case when private.json_number_ok(i.v -> 'grams', 0, 5000) then round((i.v ->> 'grams')::numeric, 1) > 0 else false end
  ) then
    raise exception 'invalid_grams' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(items) as i(v)
     where not exists (select 1 from public.foods f where f.id = i.v ->> 'foodId')
  ) then
    raise exception 'unknown_food' using errcode = 'P0002';
  end if;

  insert into public.meals (user_id, slot, local_date, time_zone, name)
  values (uid, log_meal.slot, log_meal.local_date, log_meal.time_zone, btrim(log_meal.name))
  returning id into new_meal;
  insert into public.meal_items (meal_id, food_id, grams, position)
  select new_meal, i.v ->> 'foodId', round((i.v ->> 'grams')::numeric, 1), (i.ord - 1)::smallint
    from jsonb_array_elements(items) with ordinality as i(v, ord);

  -- Read back after the item triggers have written the totals.
  select m.* into saved from public.meals m where m.id = new_meal;
  return saved;
end;
$$;

-- The API: POST /rest/v1/rpc/log_meal.
create function public.log_meal(slot public.meal_slot, local_date date, time_zone text, name text, items jsonb)
returns public.meals
language sql
security invoker
set search_path = ''
as $$
  select private.log_meal(slot, local_date, time_zone, name, items)
$$;

revoke execute on function private.log_meal(public.meal_slot, date, text, text, jsonb), public.log_meal(public.meal_slot, date, text, text, jsonb)
  from public, anon;
grant execute on function private.log_meal(public.meal_slot, date, text, text, jsonb), public.log_meal(public.meal_slot, date, text, text, jsonb)
  to authenticated;
