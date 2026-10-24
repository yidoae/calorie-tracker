-- 007: workout programs and logged sessions (specs/007-workout/data-model.md).
-- One program per user: a name, the split as the user calls it ("Push / Pull / Legs", "Upper /
-- Lower" or their own) and the days with their exercises (target sets, reps, kg) as jsonb, which
-- the app validates with @calorie/core/schemas/workout. A session is one workout on a date: the
-- day's name and every exercise with the kg × reps sets done, a snapshot that survives program
-- edits. Rows belong to their owner; the owner column is set from the token, never by the client.

create table public.workout_programs (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  split text not null check (char_length(split) between 1 and 40),
  days jsonb not null check (jsonb_typeof(days) = 'array' and jsonb_array_length(days) between 1 and 7 and pg_column_size(days) <= 32768)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  performed_on date not null,
  day_name text not null check (char_length(day_name) between 1 and 40),
  exercises jsonb not null check (jsonb_typeof(exercises) = 'array' and jsonb_array_length(exercises) between 1 and 30 and pg_column_size(exercises) <= 32768),
  created_at timestamptz not null default now()
);
create index workout_sessions_user_day on public.workout_sessions (user_id, performed_on desc);

alter table public.workout_programs enable row level security;
alter table public.workout_sessions enable row level security;

create policy "own workout program: read" on public.workout_programs for select to authenticated using (user_id = (select auth.uid()));
create policy "own workout program: add" on public.workout_programs for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own workout program: update" on public.workout_programs for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own workout sessions: read" on public.workout_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy "own workout sessions: add" on public.workout_sessions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own workout sessions: remove" on public.workout_sessions for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.workout_programs, public.workout_sessions from anon, authenticated;
grant select on public.workout_programs, public.workout_sessions to authenticated;
grant insert (name, split, days), update (name, split, days) on public.workout_programs to authenticated;
grant insert (performed_on, day_name, exercises), delete on public.workout_sessions to authenticated;
