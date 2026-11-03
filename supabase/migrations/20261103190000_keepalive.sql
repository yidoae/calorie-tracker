-- The keepalive ping (.github/workflows/keepalive.yml). Pings that Postgres refused with 42501
-- (anon reading foods) did not count as activity: the free project paused on 2026-11-03 after
-- pings on 10-28, 10-31 and 11-01. This is the one RPC anon may call; it reads no table, takes no
-- input and returns a constant, so it exposes nothing.
create function public.keepalive()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select true $$;

revoke execute on function public.keepalive() from public, authenticated;
grant execute on function public.keepalive() to anon;
