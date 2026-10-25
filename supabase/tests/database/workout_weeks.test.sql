-- 008: weekly training plans (specs/008-weekly-plan/data-model.md). One plan per user and week,
-- owner-only, rewritable; programs gain training weekdays. Users A and B exist only inside this
-- transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('a8000000-0000-4000-8000-0000000000a8', 'weeks-a@test.invalid'),
  ('b8000000-0000-4000-8000-0000000000b8', 'weeks-b@test.invalid');

select has_table('public', 'workout_weeks', 'workout_weeks exists');
select ok((select relrowsecurity from pg_class where oid = 'public.workout_weeks'::regclass), 'RLS is on');
select has_column('public', 'workout_programs', 'weekdays', 'programs have training weekdays');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a8000000-0000-4000-8000-0000000000a8', 'role', 'authenticated')::text, true);
select lives_ok(
  $$insert into public.workout_programs (name, split, days, weekdays) values ('PPL', 'PPL', '[{"name": "Push", "exercises": []}]', '{0,2,4}')$$,
  'a program stores its weekdays');
select throws_ok(
  $$update public.workout_programs set weekdays = '{0,7}' where user_id = 'a8000000-0000-4000-8000-0000000000a8'$$,
  '23514', null, 'weekdays are 0–6');
select lives_ok(
  $$insert into public.workout_weeks (week_start, intensity, plan, feedback) values ('2026-10-26', 'normal', '[]', null)$$,
  'a user stores a week''s plan');
select throws_ok(
  $$insert into public.workout_weeks (week_start, intensity, plan) values ('2026-10-27', 'normal', '[]')$$,
  '23514', null, 'a week starts on a Monday');
select throws_ok(
  $$insert into public.workout_weeks (week_start, intensity, plan) values ('2026-10-26', 'normal', '[]')$$,
  '23505', null, 'one plan per week');
select lives_ok(
  $$insert into public.workout_weeks (week_start, intensity, plan) values ('2026-10-26', 'deload', '[{"date": "2026-10-26"}]')
    on conflict (user_id, week_start) do update set intensity = excluded.intensity, plan = excluded.plan$$,
  'and rewrites it');

select set_config('request.jwt.claims', json_build_object('sub', 'b8000000-0000-4000-8000-0000000000b8', 'role', 'authenticated')::text, true);
select is((select count(*)::int from public.workout_weeks), 0, 'another user sees no week');
select set_config('request.jwt.claims', json_build_object('sub', 'a8000000-0000-4000-8000-0000000000a8', 'role', 'authenticated')::text, true);
select is((select intensity from public.workout_weeks), 'deload', 'the owner sees the rewritten week');

reset role;
select * from finish();
rollback;
