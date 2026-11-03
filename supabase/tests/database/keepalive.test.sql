-- The keepalive ping (.github/workflows/keepalive.yml): a request that Postgres answers with
-- success, because pings that ended in 42501 did not keep the free project awake (paused
-- 2026-11-03 after pings on 10-28, 10-31 and 11-01). It reads nothing and writes nothing.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select has_function('public', 'keepalive', '{}'::name[], 'keepalive exists');
select ok(has_function_privilege('anon', 'public.keepalive()', 'execute'), 'anonymous clients may ping');
select ok(not (select prosecdef from pg_proc where oid = 'public.keepalive()'::regprocedure), 'it runs as the caller');
select is((select provolatile from pg_proc where oid = 'public.keepalive()'::regprocedure), 's'::"char", 'it is stable (read-only)');

set local role anon;
select is(public.keepalive(), true, 'the ping succeeds as anon');
reset role;

select * from finish();
rollback;
