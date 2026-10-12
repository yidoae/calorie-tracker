-- Constitution VIII: no function is callable through the API (/rest/v1/rpc) unless it is meant to be.
-- None of the functions so far is an RPC. Triggers fire without the caller's execute privilege.
-- Helpers still run as the owner: recompute_meal_totals from a security definer trigger,
-- check_plan_day from nutrition_plans_validate because plans are written only by the owner and
-- by security definer RPCs, normalize_tr for food_aliases.alias_normalized when the owner seeds foods.

revoke execute on all functions in schema public from public, anon, authenticated;

-- Functions created later by the migration role (postgres) start with no grant for anon or
-- authenticated: every RPC must `grant execute on function … to authenticated` explicitly.
-- The per-schema line removes Supabase's default grants to anon and authenticated. PUBLIC's
-- execute default is global in Postgres and a per-schema revoke does not undo it, so PUBLIC is
-- also revoked without `in schema` (extension functions belong to supabase_admin: unaffected).
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges revoke execute on functions from public;
