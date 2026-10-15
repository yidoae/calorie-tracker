-- 002 part A (data-model.md "Migrations"): room for the generated food releases. Every food gets
-- where its values come from (FR-011) and a withdrawn flag (FR-010); the 001 category list gives way
-- to the 002 groups, which the release fills before 20261014000300_food_constraints.sql checks
-- them; a typical portion has the same 5000 g limit as a logged amount.

alter table public.foods
  add column source_kind text,
  add column source_ref text check (char_length(source_ref) between 1 and 200),
  add column searchable boolean not null default true;

alter table public.foods drop constraint foods_category_check;

alter table public.foods add constraint foods_typical_portion_g_max check (typical_portion_g <= 5000);
