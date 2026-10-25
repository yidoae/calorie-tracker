-- Covering index for the meal_items.food_id foreign key (performance advisor 0001): every update of
-- public.foods checks meal_items, and the list releases update every food.
create index meal_items_food on public.meal_items (food_id);
