-- 001 mobile foundation: triggers that keep the numbers server-owned (constitution III).
-- Errors carry a stable message code the app maps to Turkish text (contracts/database-api.md).

-- A profile row for every new account.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at bookkeeping.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger meals_touch before update on public.meals
  for each row execute function public.touch_updated_at();

-- Meal items: owned by the meal's owner, nutrition copied from the food database. The app sends
-- only food and grams; anything else it sends for these columns is overwritten here.
create function public.meal_items_prepare()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  food record;
begin
  if tg_op = 'UPDATE' then
    new.meal_id := old.meal_id;
  end if;

  select m.user_id into owner from public.meals m where m.id = new.meal_id;
  if owner is null then
    raise exception 'meal_not_found' using errcode = 'P0002';
  end if;
  if auth.uid() is not null and owner <> auth.uid() then
    raise exception 'meal_not_found' using errcode = 'P0002';
  end if;
  new.user_id := owner;

  if tg_op = 'INSERT' or new.food_id is distinct from old.food_id then
    select f.kcal_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g
      into food
      from public.foods f
     where f.id = new.food_id;
    if not found then
      raise exception 'unknown_food' using errcode = 'P0002';
    end if;
    new.kcal_per_100g := food.kcal_per_100g;
    new.protein_per_100g := food.protein_per_100g;
    new.carbs_per_100g := food.carbs_per_100g;
    new.fat_per_100g := food.fat_per_100g;
  else
    new.kcal_per_100g := old.kcal_per_100g;
    new.protein_per_100g := old.protein_per_100g;
    new.carbs_per_100g := old.carbs_per_100g;
    new.fat_per_100g := old.fat_per_100g;
  end if;
  return new;
end;
$$;

create trigger meal_items_prepare before insert or update on public.meal_items
  for each row execute function public.meal_items_prepare();

-- Meal totals = Σ grams × per-100 g / 100 over the meal's items, one decimal (FR-015).
create function public.recompute_meal_totals(target uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.meals m
     set total_kcal = coalesce(t.kcal, 0),
         total_protein_g = coalesce(t.protein, 0),
         total_carbs_g = coalesce(t.carbs, 0),
         total_fat_g = coalesce(t.fat, 0)
    from (
      select round(sum(i.grams * i.kcal_per_100g) / 100, 1) as kcal,
             round(sum(i.grams * i.protein_per_100g) / 100, 1) as protein,
             round(sum(i.grams * i.carbs_per_100g) / 100, 1) as carbs,
             round(sum(i.grams * i.fat_per_100g) / 100, 1) as fat
        from public.meal_items i
       where i.meal_id = target
    ) t
   where m.id = target;
$$;

create function public.meal_items_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recompute_meal_totals(new.meal_id);
  end if;
  if tg_op = 'DELETE' then
    perform public.recompute_meal_totals(old.meal_id);
  end if;
  return null;
end;
$$;

create trigger meal_items_totals after insert or update or delete on public.meal_items
  for each row execute function public.meal_items_totals();

revoke execute on function public.recompute_meal_totals(uuid) from public, anon, authenticated;

-- Plans: every day at or above the sex-specific floor, macros adding up to the calories
-- (|P·4 + C·4 + F·9 − kcal| ≤ max(10, 1 %)), no negative grams (FR-008, SC-006).
create function public.check_plan_day(sex text, kcal int, protein int, carbs int, fat int)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  floor_kcal int := case sex when 'female' then 1200 when 'male' then 1500 end;
begin
  if floor_kcal is null then
    raise exception 'invalid_plan_inputs' using errcode = '22023';
  end if;
  if kcal < floor_kcal then
    raise exception 'plan_below_floor' using errcode = '23514';
  end if;
  if protein < 0 or carbs < 0 or fat < 0 then
    raise exception 'plan_macros_mismatch' using errcode = '23514';
  end if;
  if abs(protein * 4 + carbs * 4 + fat * 9 - kcal) > greatest(10, kcal * 0.01) then
    raise exception 'plan_macros_mismatch' using errcode = '23514';
  end if;
end;
$$;

create function public.nutrition_plans_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  sex text := new.inputs ->> 'sex';
begin
  perform public.check_plan_day(sex, new.base_kcal, new.base_protein_g, new.base_carbs_g, new.base_fat_g);
  if new.training_kcal is not null then
    perform public.check_plan_day(sex, new.training_kcal, new.training_protein_g, new.training_carbs_g, new.training_fat_g);
    perform public.check_plan_day(sex, new.rest_kcal, new.rest_protein_g, new.rest_carbs_g, new.rest_fat_g);
  end if;
  return new;
end;
$$;

create trigger nutrition_plans_validate before insert or update on public.nutrition_plans
  for each row execute function public.nutrition_plans_validate();
