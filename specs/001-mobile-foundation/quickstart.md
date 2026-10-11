# Quickstart: Mobile Foundation

How to run this slice and prove it works. Details live in [data-model.md](./data-model.md) and
[contracts/](./contracts/).

## Prerequisites

- Node 22+, npm, the Supabase CLI (`npx supabase`), an Expo account (`npx eas login`).
- A Supabase **dev** project; its URL and publishable key (the app), and its database connection
  string for the pgTAP tests through the CLI (Docker needed).
- For Apple/Google sign-in: the provider setup in [research.md](./research.md) §2–3.
- A phone or emulator with the **development build** installed (Expo Go cannot load the sign-in
  modules).

## Setup

```bash
npm install                                   # all workspaces
npx supabase link --project-ref <dev-ref>
npx supabase db push                          # applies supabase/migrations (schema, RLS, triggers, RPCs, foods seed)
cp apps/mobile/.env.example apps/mobile/.env  # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY
npx eas build --profile development --platform android   # once; install the APK
npm run mobile                                # starts Metro for the development build
```

## Automated checks

| Command | Proves |
|---|---|
| `npm test -w @calorie/core` | engine, tuning, onboarding mapping, slots, day rating, normalizeTr; property tests: every day ≥ floor, macros = calories (SC-006) |
| `SUPABASE_DB_URL=… npm run test:db -w @calorie/db` (or each `supabase/tests/database/*.test.sql` through the SQL editor / MCP) | user B cannot read or change user A's profile, plans, meals or items (SC-005); totals equal Σ items after insert/update/delete; plans below the floor are rejected; no internal function is callable through the API |
| `npm run typecheck && npm run lint && npm run knip` | layers, types and no unused code across workspaces |
| `maestro test .maestro/smoke.yaml` | sign up → setup → search "tavuk" → 150 g → save → ring shows the meal (SC-001–SC-003) |

## Manual validation (both platforms)

1. **US1**: sign up with e-mail, confirm, close and reopen the app (still signed in), sign out,
   reset the password from the e-mail. On iOS: Apple; on both: Google (SC-007).
2. **US2**: complete the setup with 30 y, 180 cm, 90 kg → 80 kg, moderate, high protein; the
   dashboard targets equal `buildPlan` for those answers. Kill the app mid-setup; it resumes.
3. **US3**: search "tavuğu" (finds tavuk), log 150 g at lunch, edit to 200 g, delete; the ring
   follows each change within a second. Turn on airplane mode and save: Turkish error, input kept.
4. **US4**: wizard with cycling on 4 days; today's targets match the training/rest day; 16:8 shows
   the sensitive-content notice once.
5. **US5**: with meals on three days, the calendar marks on-target days and opens each day.
6. **Midnight**: set the device clock to 23:59 with the dashboard open; at 00:00 it shows the new day.
