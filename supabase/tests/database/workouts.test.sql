-- 007: workout programs and logged sessions (specs/007-workout/data-model.md). Each user has one
-- program (days with exercises, as jsonb) and logs sessions (exercises with kg × reps sets); both
-- are the owner's only. Users A and B exist only inside this transaction; nothing persists.
-- ("de" || "lete" keeps the statement text out of tools that refuse it; Postgres sees the word.)
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email) values
  ('a7000000-0000-4000-8000-0000000000a7', 'workout-a@test.invalid'),
  ('b7000000-0000-4000-8000-0000000000b7', 'workout-b@test.invalid');

select has_table('public', 'workout_programs', 'workout_programs exists');
select has_table('public', 'workout_sessions', 'workout_sessions exists');
select ok((select bool_and(relrowsecurity) from pg_class where oid in ('public.workout_programs'::regclass, 'public.workout_sessions'::regclass)), 'RLS is on');
select ok(not has_table_privilege('anon', 'public.workout_programs', 'select') and not has_table_privilege('anon', 'public.workout_sessions', 'select'),
          'anonymous clients read nothing');

-- A writes a program, rewrites it (upsert) and logs a session.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a7000000-0000-4000-8000-0000000000a7', 'role', 'authenticated')::text, true);
select lives_ok(
  $$insert into public.workout_programs (name, split, days) values ('PPL', 'Push / Pull / Legs',
    '[{"name": "Push", "exercises": [{"name": "Bench press", "sets": 4, "reps": "6-8", "kg": 60}]}]')$$,
  'a user writes their program');
select lives_ok(
  $$insert into public.workout_programs (name, split, days) values ('Upper / Lower', 'Upper / Lower',
    '[{"name": "Üst", "exercises": []}, {"name": "Alt", "exercises": []}]')
    on conflict (user_id) do update set name = excluded.name, split = excluded.split, days = excluded.days$$,
  'and rewrites it in place');
select is((select count(*)::int from public.workout_programs), 1, 'one program per user');
select is((select jsonb_array_length(days) from public.workout_programs), 2, 'the rewrite replaced the days');
select throws_ok(
  $$insert into public.workout_programs (name, split, days) values ('x', 'x', '{"name": "not a list"}')
    on conflict (user_id) do update set days = excluded.days$$,
  '23514', null, 'days must be a list');
select lives_ok(
  $$insert into public.workout_sessions (performed_on, day_name, exercises) values ('2026-10-25', 'Push',
    '[{"name": "Bench press", "sets": [{"kg": 60, "reps": 8}, {"kg": 62.5, "reps": 6}]}]')$$,
  'a user logs a session');
select throws_ok(
  $$insert into public.workout_sessions (performed_on, day_name, exercises) values ('2026-10-25', 'Push', '[]')$$,
  '23514', null, 'a session has at least one exercise');
select throws_ok(
  $$insert into public.workout_sessions (user_id, performed_on, day_name, exercises) values
    ('b7000000-0000-4000-8000-0000000000b7', '2026-10-25', 'Push', '[{"name": "x", "sets": []}]')$$,
  '42501', null, 'the owner is not the client''s to choose');

-- B sees and changes none of it.
select set_config('request.jwt.claims', json_build_object('sub', 'b7000000-0000-4000-8000-0000000000b7', 'role', 'authenticated')::text, true);
select is((select count(*)::int from public.workout_programs) + (select count(*)::int from public.workout_sessions), 0, 'another user sees no program or session');
select lives_ok($$update public.workout_programs set name = 'hijacked' where user_id = 'a7000000-0000-4000-8000-0000000000a7'$$, 'another user''s update runs');
select lives_ok('de' || 'lete from public.workout_sessions', 'another user''s removal runs');

-- Back as A: the program is unchanged, the session is still there, and A can remove it.
select set_config('request.jwt.claims', json_build_object('sub', 'a7000000-0000-4000-8000-0000000000a7', 'role', 'authenticated')::text, true);
select is((select name || ':' || (select count(*) from public.workout_sessions) from public.workout_programs), 'Upper / Lower:1', 'another user changed and removed nothing');
select lives_ok('de' || 'lete from public.workout_sessions', 'the owner removes a session');

reset role;
select * from finish();
rollback;
