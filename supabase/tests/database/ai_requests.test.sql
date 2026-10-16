-- 003 (T005): the daily AI allowance. ai_claim reserves an attempt before the model call and
-- ai_finish counts or releases it; a repeated request key returns the first attempt; stale
-- pending rows stop counting; the day is the user's local day (data-model.md, FR-013, FR-014).
-- Users A (Istanbul), B (Auckland) and C exist only inside this transaction; nothing persists.
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id, email) values
  ('a6000000-0000-4000-8000-0000000000a6', 'ai-a@test.invalid'),
  ('b6000000-0000-4000-8000-0000000000b6', 'ai-b@test.invalid'),
  ('c6000000-0000-4000-8000-0000000000c6', 'ai-c@test.invalid');
update public.profiles set onboarding_completed = true, time_zone = 'Europe/Istanbul' where id = 'a6000000-0000-4000-8000-0000000000a6';
update public.profiles set onboarding_completed = true, time_zone = 'Pacific/Auckland' where id = 'b6000000-0000-4000-8000-0000000000b6';
update public.profiles set onboarding_completed = true, time_zone = 'Europe/Istanbul' where id = 'c6000000-0000-4000-8000-0000000000c6';

-- The surface.
select has_table('public', 'ai_requests', 'ai_requests exists');
select ok((select relrowsecurity from pg_class where oid = 'public.ai_requests'::regclass), 'RLS is on');
select ok(not has_function_privilege('authenticated', 'public.ai_claim(uuid, uuid, text)', 'execute'), 'users cannot claim directly');
select ok(not has_function_privilege('authenticated', 'public.ai_finish(uuid, text, text, integer, integer, integer, jsonb, text)', 'execute'), 'users cannot finish directly');
select ok(has_function_privilege('service_role', 'public.ai_claim(uuid, uuid, text)', 'execute'), 'the function (service role) claims');
select ok(not has_function_privilege('anon', 'public.ai_allowance()', 'execute'), 'anonymous clients cannot read an allowance');
select ok(not has_table_privilege('authenticated', 'public.ai_requests', 'insert') and not has_table_privilege('authenticated', 'public.ai_requests', 'update')
          and not has_table_privilege('authenticated', 'public.ai_requests', 'delete'), 'users cannot write rows');

-- A claims, counts one and releases one.
select is(public.ai_claim('a6000000-0000-4000-8000-0000000000a6', '11111111-0000-4000-8000-000000000001', 'photo') ->> 'status', 'claimed', 'a first attempt is claimed');
select is((select local_date from public.ai_requests where request_key = '11111111-0000-4000-8000-000000000001'),
          (now() at time zone 'Europe/Istanbul')::date, 'the attempt is dated in the user''s time zone');
select throws_ok(
  $$select public.ai_finish((select id from public.ai_requests where request_key = '11111111-0000-4000-8000-000000000001'), 'counted', 'm', 10, 1, 1, '{"items": []}', null)$$,
  '22023', 'invalid_finish', 'counted needs at least one item');
select lives_ok(
  $$select public.ai_finish((select id from public.ai_requests where request_key = '11111111-0000-4000-8000-000000000001'), 'counted', 'm', 10, 1, 1, '{"items": [{"food_id": "egg", "grams": 50, "estimated": true}], "unmatched": []}', null)$$,
  'an answered attempt is counted');
select throws_ok(
  $$select public.ai_finish((select id from public.ai_requests where request_key = '11111111-0000-4000-8000-000000000001'), 'released', null, null, null, null, null, 'ai_unavailable')$$,
  '55000', 'already_finished', 'an attempt finishes once');

select is(public.ai_claim('a6000000-0000-4000-8000-0000000000a6', '11111111-0000-4000-8000-000000000001', 'photo') ->> 'status', 'existing', 'a repeated key returns the first attempt');
select is((public.ai_claim('a6000000-0000-4000-8000-0000000000a6', '11111111-0000-4000-8000-000000000001', 'photo') -> 'result' -> 'items' -> 0 ->> 'food_id'), 'egg', '… with its stored result');

select public.ai_claim('a6000000-0000-4000-8000-0000000000a6', '11111111-0000-4000-8000-000000000002', 'text');
select public.ai_finish((select id from public.ai_requests where request_key = '11111111-0000-4000-8000-000000000002'), 'released', null, null, null, null, null, 'no_food');

-- A fills the day: counted 1, released 1, then four more → five in use; the sixth is refused.
select public.ai_claim('a6000000-0000-4000-8000-0000000000a6', ('11111111-0000-4000-8000-00000000001' || n)::uuid, 'text') from generate_series(0, 3) n;
select is(public.ai_claim('a6000000-0000-4000-8000-0000000000a6', '11111111-0000-4000-8000-000000000099', 'photo') ->> 'status', 'limit_reached', 'the sixth attempt of the day is refused');
select is((public.ai_claim('a6000000-0000-4000-8000-0000000000a6', '11111111-0000-4000-8000-000000000099', 'photo') ->> 'resets_at')::timestamptz,
          (((now() at time zone 'Europe/Istanbul')::date + 1)::timestamp at time zone 'Europe/Istanbul'), '… with the next local midnight');
select is((select count(*)::int from public.ai_requests where user_id = 'a6000000-0000-4000-8000-0000000000a6'), 6, 'a refused attempt leaves no row');

-- A pending attempt older than two minutes no longer counts and can no longer be finished.
update public.ai_requests set created_at = now() - interval '3 minutes' where request_key = '11111111-0000-4000-8000-000000000010';
select is(public.ai_claim('a6000000-0000-4000-8000-0000000000a6', '11111111-0000-4000-8000-000000000098', 'photo') ->> 'status', 'claimed', 'a stale pending attempt frees its place');
select throws_ok(
  $$select public.ai_finish((select id from public.ai_requests where request_key = '11111111-0000-4000-8000-000000000010'), 'released', null, null, null, null, null, 'ai_unavailable')$$,
  '55000', 'already_finished', 'a stale attempt cannot be finished');

-- B in Auckland gets their own local date.
select public.ai_claim('b6000000-0000-4000-8000-0000000000b6', '22222222-0000-4000-8000-000000000001', 'photo');
select is((select local_date from public.ai_requests where request_key = '22222222-0000-4000-8000-000000000001'),
          (now() at time zone 'Pacific/Auckland')::date, 'another user''s day follows their own time zone');

-- What the app sees.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a6000000-0000-4000-8000-0000000000a6', 'role', 'authenticated')::text, true);
select results_eq($$select used, "limit" from public.ai_allowance()$$, $$values (5, 5)$$, 'A sees five of five used');
select is((select count(*)::int from public.ai_requests), 7, 'A reads only their own attempts');
select throws_ok($$select public.ai_claim('a6000000-0000-4000-8000-0000000000a6', '33333333-0000-4000-8000-000000000001', 'photo')$$, '42501', null, 'A cannot claim through the API');

select set_config('request.jwt.claims', json_build_object('sub', 'c6000000-0000-4000-8000-0000000000c6', 'role', 'authenticated')::text, true);
select results_eq($$select used, "limit" from public.ai_allowance()$$, $$values (0, 5)$$, 'C has the full allowance');
select is_empty($$select 1 from public.ai_requests$$, 'C sees no attempts of others');

select * from finish();
rollback;
