# Validation: Mobile Foundation (T060)

What [quickstart.md](../quickstart.md) asks for, what was verified and where, and what still needs a
device. Recorded 2026-10-13 at the end of Phase 8; the agent environment has no emulator, phone or
Docker. The owner tried parts of the app on an Android phone through Expo Go.

## Automated checks

| Check | Result |
|---|---|
| `npm test` (core node:test + fast-check; app pure helpers) | ✅ core 43, mobile 75 |
| `npm run typecheck && npm run lint && npm run knip` | ✅ clean |
| `npx expo export --platform android` | ✅ bundle builds |
| `npm run preview` | ✅ every screen in `tools/preview/dist/artifact.html` |
| pgTAP `supabase/tests/database/*.test.sql` (7 files, through the Supabase MCP) | ✅ all `ok` at the last schema change (migration `20261011000600`, re-run in Phase 6); Phases 7–8 changed no SQL |
| Security advisor | ⚠️ 1 WARN `auth_leaked_password_protection`: an Auth setting that needs the Pro plan; owner decision on the free plan |
| Performance advisor | ℹ️ 2 INFO: `meal_items.food_id` has no covering index; `food_aliases_trgm` unused so far (little data on dev). Revisit with real data in 002 |
| `maestro test .maestro/smoke.yaml` | ⏳ written, not run (needs a development build on an emulator or phone; prerequisites at the top of the file) |

## Manual validation (quickstart "both platforms")

| Step | Android (owner, Expo Go) | iPhone | Notes |
|---|---|---|---|
| 1. US1 e-mail sign-up, stay signed in, sign out, password reset | ✅ sign-up and sign-in | ⏳ | Confirm e-mail is OFF on dev for Expo Go; reset e-mail not tried |
| 1. US1 Google / Apple | ⏳ | ⏳ | Need a development build and the owner's OAuth clients / Apple membership |
| 2. US2 setup, targets equal `buildPlan`, resume after kill | ✅ setup completes (double-question bug fixed in `1476c9f`) | ⏳ | Resume after kill not tried on a device |
| 3. US3 search "tavuğu", 150 g, edit to 200 g, delete; offline save | ✅ search and logging | ⏳ | Edit/delete and airplane mode not tried on a device |
| 4. US4 wizard with cycling, sensitive notice once | ✅ wizard sliders (2026-10-13) | ⏳ | Notice opens on selection (owner ruling) |
| 5. US5 calendar marks three days, each day opens | ⏳ | ⏳ | Checked in the preview only |
| 6. Midnight roll-over | ⏳ | ⏳ | `useToday` timer + foreground refresh; unit-tested helpers only |

## Deviations from the plan

- **Database tests are pgTAP**, not TypeScript suites: no service-role key was available and the
  machine has no Docker; the files run through the Supabase MCP (or `supabase test db` in CI).
- **Google and Apple sign-in are env-gated**: the buttons render only when configured.
- **Expo Go instead of a development build** for the owner's tests so far; the native sign-in
  modules are not in Expo Go.
- **Rating past days** uses the plan in effect at the end of that day (owner ruling, 2026-10-13).

## Owner TODOs before real users

- Expo account and the final bundle ID / package (placeholder `com.kaloritakip.app`).
- Google OAuth clients (iOS, Android, web) and an Apple Developer membership.
- Auth: switch **Confirm email** back ON and add a custom SMTP provider (the built-in one only
  delivers to team addresses); keep `kaloritakip://**` in the redirect allow-list.
- Verify the kaşar, white bread and simit values; decide on the broad search aliases.
- Run the Maestro flow and steps 1–6 on an Android emulator and an iPhone, then tick this file.
