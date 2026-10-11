# Research: Mobile Foundation

Decisions behind [plan.md](./plan.md), checked against official documentation on 2026-10-09.

## 1. Session storage on the device

- **Decision**: supabase-js with `persistSession: true`, `autoRefreshToken: true`,
  `detectSessionInUrl: false`, and a storage adapter that keeps an AES-256 key in
  `expo-secure-store` and the encrypted session in AsyncStorage (the "LargeSecureStore" pattern from
  Supabase's Expo tutorial). Auto refresh is started and stopped with `AppState`.
- **Rationale**: FR-004 requires secure storage. SecureStore alone can refuse values over about
  2 KB on some iOS releases, and a Supabase session with provider tokens can exceed that.
- **Alternatives**: `expo-sqlite/localStorage` (Supabase's current quickstart default): simpler, but
  the session is stored unencrypted. Plain SecureStore: size limit risk.
- Sources: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native ·
  https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native ·
  https://docs.expo.dev/versions/latest/sdk/securestore/

## 2. Sign in with Apple

- **Decision**: iOS only, native: `expo-apple-authentication` → `supabase.auth.signInWithIdToken`
  with a nonce (SHA-256 to Apple, raw to Supabase). The full name, which Apple sends only on the first
  sign-in, is saved to the user's metadata. Android offers e-mail and Google.
- **Rationale**: App Store guideline 4.8 requires an equivalent privacy-preserving login on iOS when
  Google login is offered; it does not apply to Google Play. Apple on Android needs the browser OAuth
  flow, a Services ID and a client secret that must be regenerated every six months.
- **Alternatives**: Apple on Android through OAuth: more setup and recurring maintenance for few
  users.
- **Prerequisite**: a paid Apple Developer account; the bundle ID listed under Client IDs in the
  Supabase Apple provider.
- Sources: https://supabase.com/docs/guides/auth/social-login/auth-apple ·
  https://docs.expo.dev/versions/latest/sdk/apple-authentication/ ·
  https://developer.apple.com/app-store/review/guidelines/#login-services

## 3. Google sign-in

- **Decision**: `@react-native-google-signin/google-signin` with its Expo config plugin
  (`iosUrlScheme`), then `signInWithIdToken({ provider: 'google' })`. Web, iOS and Android OAuth
  clients; the Android client needs the debug and release SHA-1 fingerprints.
- **Rationale**: Supabase's recommended native flow; no browser hop.
- **Consequence**: does not run in Expo Go, so development uses an EAS development build.
- Sources: https://supabase.com/docs/guides/auth/social-login/auth-google ·
  https://react-native-google-signin.github.io/docs/setting-up/expo

## 4. One person, several sign-in methods

- **Decision**: rely on Supabase's automatic identity linking (same verified e-mail → same user).
  Apple "Hide My Email" relay addresses never match, so those users stay separate; a manual "link
  another sign-in" setting is deferred to 005.
- **Rationale**: covers the spec's edge case (Google then e-mail) with no code; unconfirmed
  identities are dropped on linking, which prevents pre-account takeover.
- Source: https://supabase.com/docs/guides/auth/auth-identity-linking

## 5. Monorepo

- **Decision**: npm workspaces (`apps/*`, `packages/*`) with the default `expo/metro-config`
  (automatic monorepo support since SDK 52). `@calorie/core` exports TypeScript source (no build
  step); a single `react` / `react-native` copy is pinned with root `overrides` and checked with
  `npm why react`.
- **Rationale**: removing Next.js removes the second React version that forced a custom resolver in
  mybike.
- Source: https://docs.expo.dev/guides/monorepos/

## 6. Server logic without Edge Functions (for 001)

- **Decision**: atomic writes as `security definer` SQL functions called over RPC; invariants as
  triggers and check constraints. Edge Functions start with 003 (AI) and will be deployed with
  `supabase functions deploy --use-api`, which bundles imports from `packages/core` without Docker.
- **Rationale**: 001 needs no secrets and no third-party calls; SQL keeps the rules next to the data
  and avoids a second runtime.
- Source: https://supabase.com/changelog/33613-deploy-edge-functions-from-cli-without-needing-docker-import-files-outside-of-supabase-directory

## 7. Database tests without Docker

- **Decision**: a hosted Supabase **dev project** (separate from production). Migrations are applied
  with `supabase db push`. Tests are `node:test` suites in `supabase/tests/` that create two
  throwaway users with the admin API, act as each user through supabase-js, assert RLS, triggers and
  RPC errors, and delete the users afterwards.
- **Rationale**: `supabase test db` (pgTAP) runs in a container and needs Docker even against a
  remote database; this machine has no Docker. Branching is a paid feature.
- **Alternatives**: install Docker Desktop and use `supabase start` + pgTAP; Supabase branching.
- Sources: https://supabase.com/docs/reference/cli/supabase-test-db ·
  https://supabase.com/docs/guides/database/testing
- **Change (2026-10-11)**: the tests are **pgTAP** files in `supabase/tests/database/`, run against
  the hosted dev project. The node suites needed the service-role key, which is not kept in the repo,
  CI or agent sessions. Each pgTAP file creates its users in `auth.users` inside a transaction, acts
  as them with `set local role` + `request.jwt.claims`, and rolls back, so no key is needed and
  nothing persists. Locally a file runs as one SQL statement (Supabase MCP `execute_sql` or the SQL
  editor); CI runs `supabase test db --db-url "$SUPABASE_DB_URL"` (GitHub runners have Docker).

## 8. Turkish search

- **Decision**: an IMMUTABLE SQL function `normalize_tr(text)` (Turkish-specific `translate` of
  İ/I/ı/Ç/Ğ/Ö/Ş/Ü and their lower-case forms to ASCII, then `lower`) fills a stored
  `alias_normalized` column; a GIN `gin_trgm_ops` index serves prefix and similarity search.
  `search_foods` normalizes the query with the same function. The app adds suffix candidates
  ("tavuğu" → "tavuk") with core `searchStems`. A test asserts that core `normalizeTr` and SQL
  `normalize_tr` agree on a fixture list.
- **Rationale**: Postgres `lower()` follows the collation and mishandles Turkish dotted/dotless i;
  doing the fold in the database also covers rows that users add later (own foods in 002).
- **Alternatives**: `unaccent` wrapper (works, but its rules are not Turkish-specific);
  nondeterministic ICU collations (no LIKE support).
- Sources: https://supabase.com/docs/guides/database/extensions ·
  https://www.postgresql.org/docs/current/collation.html

## 9. Packages for Expo SDK 57

Installed with `npx expo install` so versions match the SDK:

| Package | Version |
|---|---|
| expo / expo-router | ~57.0.27 / ~57.0.25 |
| react-native / react | 0.86.3 / 19.2.3 |
| expo-secure-store | ~57.0.4 |
| @react-native-async-storage/async-storage | 2.2.0 |
| expo-localization | ~57.0.2 (time zone: `getCalendars()[0].timeZone`) |
| expo-apple-authentication | ~57.0.2 |
| react-native-svg | 15.15.4 (rings) |
| @tanstack/react-query | 5 (peer React 18/19; `focusManager` on AppState) |
| @supabase/supabase-js | 2 |

E2E: Maestro with `launchApp` on the development build; on this Windows machine against an Android
emulator, later in EAS Workflows. iOS simulators need macOS (the owner's Mac).
Sources: https://expo.dev/changelog/sdk-57 · https://tanstack.com/query/latest/docs/framework/react/react-native ·
https://docs.maestro.dev/get-started/supported-platform/react-native

## Prerequisites outside the repository (owner's accounts)

1. Supabase: a **dev** project now, a **production** project before store release.
2. Apple Developer Program membership (bundle ID, Sign in with Apple capability).
3. Google Cloud OAuth clients (web, iOS, Android) and the Android SHA-1 fingerprints.
4. An Expo account for EAS builds.
