# Database (`@calorie/db`)

Migrations and pgTAP tests for the Supabase dev project `kalori-takip-dev` (ref `hhymtqbugbeiqszcpyai`).
Why pgTAP on the hosted project: [research.md §7](../specs/001-mobile-foundation/research.md).

## Migrations

`migrations/<version>_<name>.sql`, applied in version order. An applied file is never edited; a
change is a new file. A new version must sort after every existing one: a migration replayed before
`20261011000100_function_privileges.sql` loses its `grant execute` to the revoke.

To apply one without a linked CLI (how the dev project is maintained), run the file's exact SQL
with the Supabase MCP `apply_migration` (name = `<name>`), then record the file's version:

```sql
update supabase_migrations.schema_migrations set version = '<version>' where name = '<name>';
```

With the CLI: `npx supabase link --project-ref hhymtqbugbeiqszcpyai` and `npx supabase db push`.

Every function in `public` starts without execute for `anon` and `authenticated`
(`20261011000100_function_privileges.sql`). An RPC needs
`grant execute on function … to authenticated;` in its migration.

An RPC that writes what the API roles cannot (plans, `onboarding_completed`) keeps its
`security definer` body in the `private` schema, which the API does not expose, behind a
`security invoker` function of the same name in `public` that only calls it
(`20261011000200_onboarding_rpcs.sql`): the security advisor (lint 0029) warns about any
`security definer` function in `public` that `authenticated` can execute. `authenticated` has
usage on `private` and execute only on the RPC bodies, never on the helpers next to them.

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

- One file: pass its whole contents to MCP `execute_sql`. Only the last result with rows comes back,
  so the file ends with `select * from finish();`, which returns a row only when tests failed or
  were not run ("# Looks like you failed 1 test of 24"). If the last test's `ok N - …` line comes
  back instead, every test passed. To see which test failed, run the file up to that test.
- All files (Docker needed): `SUPABASE_DB_URL=postgresql://… npm run test:db -w @calorie/db` (POSIX
  shell; cmd.exe does not expand `$SUPABASE_DB_URL`). CI does the same when the `SUPABASE_DB_URL`
  secret is set. Use the **session pooler** connection string from the dashboard
  (`…pooler.supabase.com:5432`): the direct `db.<ref>.supabase.co` host is IPv6-only and GitHub
  runners have no IPv6.

## Auth (dashboard setup for US1)

The app signs in with e-mail and password, Google and (iOS) Apple, all through `supabase-js`
([research.md §1–4](../specs/001-mobile-foundation/research.md)). These settings live in the
dashboard, not in migrations. **None of them has been set from this repository** (there is no
management token here), so every item below is an **owner TODO** until it is ticked. Ticked items were set on the dev project on 2026-10-11 and checked after a reload. Apply the same
settings to the production project before store release.

- [x] **E-mail sign-up** (Authentication → Sign In / Providers → Email): enabled, **Confirm email**
  on (FR-002). Minimum password length **8**, the same rule the app checks
  (`apps/mobile/src/hooks/authValidation.ts`).
  **Dev, 2026-10-11: Confirm email is temporarily OFF** so the app can be tried in Expo Go, where
  `kaloritakip://` links do not open the app; sign-up then returns a session and skips the
  "E-postanı doğrula" step. Switch it back on before real users.
- [x] **Site URL** (Authentication → URL Configuration): `kaloritakip://`. There is no website; the
  Site URL is only the fallback when a link's redirect is not allowed.
- [x] **Redirect URLs** (same page): add `kaloritakip://**`. Confirmation and reset e-mails redirect
  to `kaloritakip://auth/confirm` and `kaloritakip://auth/reset` with a PKCE `code`; without this
  entry Supabase sends the user to the Site URL instead and the app never sees the code.
- [ ] **Google** (Authentication → Sign In / Providers → Google), after creating the Google Cloud
  OAuth clients (consent screen, then a **Web**, an **iOS** client for bundle ID
  `com.kaloritakip.app` and an **Android** client for package `com.kaloritakip.app` with the SHA-1
  of the debug and the EAS release keystores, `npx eas-cli@latest credentials`):
  enable; **Client IDs**: the web client ID, then the iOS client ID (comma-separated; tokens from
  Android carry the web client ID as audience, tokens from iOS the iOS one); **Client Secret**: the
  web client's secret; **Skip nonce check**: **off**. Put the two IDs in `apps/mobile/.env` as
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (see `.env.example`);
  the Google button stays hidden until they are set, and `app.config.ts` adds the google-signin
  config plugin (iOS URL scheme) only when the iOS ID is set. Then make a new development build.
  Caveat to check on the first iPhone test: the free google-signin library cannot pass a nonce, and
  Supabase's docs report nonce failures with some mobile Google SDKs. If iOS Google sign-in fails
  with a nonce error, report it instead of turning "Skip nonce check" on for good (Supabase calls
  that a short-lived workaround).
- [ ] **Apple** (Authentication → Sign In / Providers → Apple), after joining the Apple Developer
  Program and enabling the **Sign in with Apple** capability on the App ID `com.kaloritakip.app`:
  enable; **Client IDs**: the iOS bundle ID `com.kaloritakip.app`. The native iOS flow needs no
  secret key. A **Services ID** plus a secret key (which must be regenerated every six months) is
  only needed for Apple sign-in through the browser (web or Android), which 001 does not offer; if
  it is added later, list the Services ID under Client IDs as well.
- [ ] **E-mail delivery**: the built-in SMTP server is for development only. It delivers **only to
  e-mail addresses of the organization's team members** (anyone else gets "Email address not
  authorized", shown in the app as "Bu adrese şu anda e-posta gönderilemiyor…") and allows only a
  few messages per hour, a limit Supabase may change without notice. Testing sign-up with outside
  addresses, and any release, needs a custom SMTP provider (Authentication → Emails → SMTP
  Settings). Turkish e-mail templates (Authentication → Emails → Templates) are also still to do;
  keep `{{ .ConfirmationURL }}` in them, it carries the redirect.

How the links behave (good to know when testing): the PKCE verifier is stored on the device that
asked for the e-mail, so a link must be opened on that phone, and only the link from the newest
request on that phone works (every sign-up, resend or reset request replaces the verifier). A confirmation link opened elsewhere still confirms the address;
the user can then sign in with the password. A reset link signs the user in and the app keeps them
on "Yeni şifre" until the new password is saved.
