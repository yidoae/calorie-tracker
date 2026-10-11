# Database (`@calorie/db`)

Migrations and pgTAP tests for the Supabase dev project `kalori-takip-dev` (ref `hhymtqbugbeiqszcpyai`).
Why pgTAP on the hosted project: [research.md §7](../specs/001-mobile-foundation/research.md).

## Migrations

`migrations/<version>_<name>.sql`, applied in version order. An applied file is never edited; a
change is a new file.

To apply one without a linked CLI (how the dev project is maintained), run the file's exact SQL
with the Supabase MCP `apply_migration` (name = `<name>`), then record the file's version:

```sql
update supabase_migrations.schema_migrations set version = '<version>' where name = '<name>';
```

With the CLI: `npx supabase link --project-ref hhymtqbugbeiqszcpyai` and `npx supabase db push`.

Every function in `public` starts without execute for `anon` and `authenticated`
(`20261011000100_function_privileges.sql`). An RPC needs
`grant execute on function … to authenticated;` in its migration.

After each migration, regenerate the types and check the security advisor (a new warning is a
defect):

- `packages/core/src/db/database.types.ts`: the verbatim output of MCP `generate_typescript_types`,
  or `npx supabase gen types typescript --linked`. `packages/core/tests/rows.test.ts` stops
  compiling when a row schema in `rows.ts` drifts from it.
- MCP `get_advisors` (security), or the dashboard's Security Advisor.

## Tests

`tests/database/*.test.sql`. Each file runs in one transaction that ends in `rollback`, creates its
users in `auth.users` and acts as them with `set local role authenticated` plus
`request.jwt.claims`; nothing persists. A test covering a new migration is written first and must
fail before the migration is applied.

- One file: pass its whole contents to MCP `execute_sql` or the dashboard SQL editor. Only the last
  result comes back, so the last line before `rollback` is `select * from finish();`: no row
  means every test passed; otherwise it reports how many failed or were not run.
- All files (Docker needed): `SUPABASE_DB_URL=postgresql://… npm run test:db -w @calorie/db`. CI
  does the same when the `SUPABASE_DB_URL` secret is set.
