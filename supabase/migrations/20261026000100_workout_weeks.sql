-- 008: weekly training plans (specs/008-weekly-plan/data-model.md).
-- Programs gain their training weekdays (Monday = 0; empty lets the app spread the days). Each
-- user has at most one plan per week (Monday): the intensity, the dated days with their targets
-- and the feedback on the week before, all built by @calorie/core/workout/plan from the logged
-- weights. The app writes it from Sunday 18:00 and may rewrite it after a program change.

alter table public.workout_programs
  add column weekdays smallint[] not null default '{}'
    check (weekdays <@ '{0,1,2,3,4,5,6}'::smallint[] and cardinality(weekdays) <= 7);
grant insert (weekdays), update (weekdays) on public.workout_programs to authenticated;

create table public.workout_weeks (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  intensity text not null check (intensity in ('normal', 'light', 'deload')),
  plan jsonb not null check (jsonb_typeof(plan) = 'array' and jsonb_array_length(plan) <= 7 and pg_column_size(plan) <= 32768),
  feedback jsonb check (feedback is null or (jsonb_typeof(feedback) = 'object' and pg_column_size(feedback) <= 16384)),
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.workout_weeks enable row level security;
create policy "own workout weeks: read" on public.workout_weeks for select to authenticated using (user_id = (select auth.uid()));
create policy "own workout weeks: add" on public.workout_weeks for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own workout weeks: update" on public.workout_weeks for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.workout_weeks from anon, authenticated;
grant select on public.workout_weeks to authenticated;
grant insert (week_start, intensity, plan, feedback), update (intensity, plan, feedback) on public.workout_weeks to authenticated;
