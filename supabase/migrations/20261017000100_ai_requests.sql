-- 003: the daily AI allowance (specs/003-ai-logging/data-model.md, FR-013, FR-014).
-- One row per analysis attempt. The ai-log Edge Function reserves an attempt with ai_claim before
-- it calls the model and settles it with ai_finish: `counted` when the model returned foods,
-- `released` otherwise. A repeated request key returns the first attempt, so a retry is counted
-- once. Pending attempts older than two minutes no longer count (a crashed function must not eat
-- the allowance). The day is the user's local day from profiles.time_zone. Rows hold food ids and
-- grams, never the image or the typed text. Only the service role (the function) claims and
-- finishes; users read their own rows and their allowance.

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  request_key uuid not null,
  kind text not null check (kind in ('photo', 'text')),
  local_date date not null,
  status text not null default 'pending' check (status in ('pending', 'counted', 'released')),
  model text check (char_length(model) between 1 and 80),
  latency_ms integer check (latency_ms >= 0),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  result jsonb,
  error text check (char_length(error) between 1 and 40),
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (user_id, request_key)
);
create index ai_requests_user_day on public.ai_requests (user_id, local_date);

alter table public.ai_requests enable row level security;
create policy "ai requests: read own" on public.ai_requests for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.ai_requests from anon, authenticated;
grant select on public.ai_requests to authenticated;

create function private.ai_daily_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 5 $$;

-- The user's time zone, UTC until the setup has stored one.
create function private.ai_time_zone(user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$ select coalesce((select p.time_zone from public.profiles p where p.id = ai_time_zone.user_id), 'UTC') $$;

-- Attempts that use the allowance on a local date: counted ones and pending ones younger than two minutes.
create function private.ai_used(user_id uuid, day date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.ai_requests r
   where r.user_id = ai_used.user_id and r.local_date = ai_used.day
     and (r.status = 'counted' or (r.status = 'pending' and r.created_at > now() - interval '2 minutes'))
$$;

create function private.ai_claim(user_id uuid, request_key uuid, kind text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  tz text := private.ai_time_zone(ai_claim.user_id);
  today date := (now() at time zone tz)::date;
  prior public.ai_requests;
  new_id uuid;
begin
  if ai_claim.kind is null or ai_claim.kind not in ('photo', 'text') then
    raise exception 'invalid_request' using errcode = '22023';
  end if;
  -- One claim per user at a time, so parallel requests cannot pass the limit together.
  perform 1 from public.profiles p where p.id = ai_claim.user_id for update;

  select r.* into prior from public.ai_requests r where r.user_id = ai_claim.user_id and r.request_key = ai_claim.request_key;
  if prior.id is not null then
    return jsonb_build_object('status', 'existing', 'id', prior.id, 'row_status', prior.status, 'result', prior.result, 'error', prior.error);
  end if;

  if private.ai_used(ai_claim.user_id, today) >= private.ai_daily_limit() then
    return jsonb_build_object('status', 'limit_reached', 'resets_at', ((today + 1)::timestamp at time zone tz));
  end if;

  insert into public.ai_requests (user_id, request_key, kind, local_date)
  values (ai_claim.user_id, ai_claim.request_key, ai_claim.kind, today)
  returning id into new_id;
  return jsonb_build_object('status', 'claimed', 'id', new_id);
end;
$$;

create function private.ai_finish(id uuid, status text, model text, latency_ms integer, input_tokens integer, output_tokens integer, result jsonb, error text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if ai_finish.status is null or ai_finish.status not in ('counted', 'released')
     or (ai_finish.status = 'counted' and coalesce(jsonb_array_length(ai_finish.result -> 'items'), 0) = 0) then
    raise exception 'invalid_finish' using errcode = '22023';
  end if;
  update public.ai_requests r
     set status = ai_finish.status, model = ai_finish.model, latency_ms = ai_finish.latency_ms,
         input_tokens = ai_finish.input_tokens, output_tokens = ai_finish.output_tokens,
         result = case when ai_finish.status = 'counted' then ai_finish.result end,
         error = ai_finish.error, finished_at = now()
   where r.id = ai_finish.id and r.status = 'pending' and r.created_at > now() - interval '2 minutes';
  if not found then
    raise exception 'already_finished' using errcode = '55000';
  end if;
end;
$$;

create function private.ai_allowance()
returns table (used integer, "limit" integer, resets_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  tz text;
  today date;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  tz := private.ai_time_zone(uid);
  today := (now() at time zone tz)::date;
  return query select private.ai_used(uid, today), private.ai_daily_limit(), ((today + 1)::timestamp at time zone tz);
end;
$$;

-- The API: ai_claim and ai_finish for the ai-log function (service role), ai_allowance for the app.
create function public.ai_claim(user_id uuid, request_key uuid, kind text)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.ai_claim(user_id, request_key, kind) $$;

create function public.ai_finish(id uuid, status text, model text, latency_ms integer, input_tokens integer, output_tokens integer, result jsonb, error text)
returns void language sql security invoker set search_path = ''
as $$ select private.ai_finish(id, status, model, latency_ms, input_tokens, output_tokens, result, error) $$;

create function public.ai_allowance()
returns table (used integer, "limit" integer, resets_at timestamptz) language sql stable security invoker set search_path = ''
as $$ select * from private.ai_allowance() $$;

revoke execute on function private.ai_daily_limit(), private.ai_time_zone(uuid), private.ai_used(uuid, date),
  private.ai_claim(uuid, uuid, text), private.ai_finish(uuid, text, text, integer, integer, integer, jsonb, text), private.ai_allowance(),
  public.ai_claim(uuid, uuid, text), public.ai_finish(uuid, text, text, integer, integer, integer, jsonb, text), public.ai_allowance()
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.ai_daily_limit(), private.ai_time_zone(uuid), private.ai_used(uuid, date),
  private.ai_claim(uuid, uuid, text), private.ai_finish(uuid, text, text, integer, integer, integer, jsonb, text),
  public.ai_claim(uuid, uuid, text), public.ai_finish(uuid, text, text, integer, integer, integer, jsonb, text)
  to service_role;
grant execute on function private.ai_allowance(), public.ai_allowance() to authenticated;
