-- US1 (T023): a signed-in user fills in their own profile through the API but cannot complete
-- onboarding, take over another id or create a second profile. Already covered elsewhere:
-- triggers.test.sql (sign-up creates exactly one profile, onboarding_completed = false) and
-- rls.test.sql (B cannot read or update A's profile, the app cannot set onboarding_completed).
-- Users P and Q exist only inside this transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('a1000000-0000-4000-8000-0000000000a1', 'profiles-p@test.invalid'),
  ('b1000000-0000-4000-8000-0000000000b1', 'profiles-q@test.invalid');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a1000000-0000-4000-8000-0000000000a1', 'role', 'authenticated')::text, true);

select results_eq(
  $$update public.profiles
      set sex = 'female', birth_year = 1994, height_cm = 168, weight_kg = 72.5, goal_weight_kg = 65,
          activity_level = 'moderate', diet_style = 'highProtein', fat_per_kg = 1.10,
          time_zone = 'Europe/Istanbul', sensitive_warning_ack = true
      where id = 'a1000000-0000-4000-8000-0000000000a1'
      returning id$$,
  $$values ('a1000000-0000-4000-8000-0000000000a1'::uuid)$$,
  'a user can update their own profile fields');
select results_eq(
  $$select sex::text, birth_year, height_cm, weight_kg, goal_weight_kg, activity_level::text, diet_style::text, fat_per_kg, time_zone, sensitive_warning_ack
      from public.profiles$$,
  $$values ('female', 1994, 168.0, 72.5, 65.0, 'moderate', 'highProtein', 1.10, 'Europe/Istanbul', true)$$,
  'the user reads back what they saved');

select throws_ok(
  $$update public.profiles set height_cm = 170, onboarding_completed = true where id = 'a1000000-0000-4000-8000-0000000000a1'$$,
  '42501', null, 'an update that also sets onboarding_completed is refused as a whole');
select throws_ok(
  $$update public.profiles set height_cm = 300 where id = 'a1000000-0000-4000-8000-0000000000a1'$$,
  '23514', null, 'an out-of-range body value is refused');
select throws_ok(
  $$update public.profiles set id = 'b1000000-0000-4000-8000-0000000000b1' where id = 'a1000000-0000-4000-8000-0000000000a1'$$,
  '42501', null, 'a user cannot move their profile to another id');
select throws_ok(
  $$insert into public.profiles (id) values ('a1000000-0000-4000-8000-0000000000a1')$$,
  '42501', null, 'a user cannot create a profile (only the sign-up trigger does)');

reset role;
select is((select height_cm from public.profiles where id = 'a1000000-0000-4000-8000-0000000000a1'), 168.0, 'the refused updates changed nothing');
select is((select onboarding_completed from public.profiles where id = 'a1000000-0000-4000-8000-0000000000a1'), false, 'filling in the profile does not complete onboarding');
select is((select count(*)::int from public.profiles where id in ('a1000000-0000-4000-8000-0000000000a1', 'b1000000-0000-4000-8000-0000000000b1')), 2, 'each account still has exactly one profile');

select * from finish();
rollback;
