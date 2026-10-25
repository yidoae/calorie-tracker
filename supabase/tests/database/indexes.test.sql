-- Foreign keys that the performance advisor flagged get a covering index (admin, 2026-10-25):
-- meal_items.food_id is checked on every change to foods. Nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);

select has_index('public', 'meal_items', 'meal_items_food', array['food_id'], 'meal_items(food_id) has an index');

select * from finish();
rollback;
