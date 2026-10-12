# Implementation Plan: Mobile Foundation

**Branch**: `001-mobile-foundation` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-mobile-foundation/spec.md`

## Summary

Replace the Next.js web app with an Expo app for iOS and Android on Supabase. This slice delivers
accounts (e-mail, Apple, Google), the first-time setup, the plan wizard with tuning, logging a meal
by food search with a mandatory gram review, the daily dashboard and past days. The pure nutrition
logic and Zod schemas already in the repository move into `packages/core` and are reused by the app
and by the database seed; everything the web app had that 001 does not use is deleted (constitution
VI) and comes back from git history when its feature (002–005) needs it. 001 needs no Edge
Function: atomic writes and the invariants live in Postgres functions and triggers under RLS.

## Technical Context

**Language/Version**: TypeScript 5 (strict) for the app and core; SQL (PostgreSQL 17 on Supabase) for
migrations, functions and triggers.

**Primary Dependencies**: Expo SDK 57 with expo-router, React Native 0.86, React 19.2;
`@supabase/supabase-js` 2; `@tanstack/react-query` 5; `expo-secure-store`, `expo-localization`,
`expo-apple-authentication`, `@react-native-google-signin/google-signin`, `react-native-svg`;
Zod 4 in `@calorie/core`. Exact choices and versions: [research.md](./research.md).

**Storage**: Supabase Postgres (tables, RLS, triggers, RPC functions per
[data-model.md](./data-model.md)); session in the device's secure storage. No Storage bucket yet
(photos arrive with 003).

**Testing**: `@calorie/core`: `node:test` via `tsx` (the existing tests carried over where their
module is kept) plus `fast-check` property tests for the plan engine. Database: `node:test` suites
that sign in as two test users against the hosted dev project and assert RLS, triggers and RPC
errors. App: typecheck, lint and one Maestro flow (sign-up → setup → log a meal → ring updates) run
on a development build. CI: typecheck, lint, knip and core tests for every workspace; database
tests run when the dev project's secrets are present.

**Target Platform**: iOS and Android phones (Expo SDK 57 minimums); development builds through EAS
because Sign in with Apple and Google sign-in do not run in Expo Go.

**Project Type**: mobile app + backend-as-a-service (npm-workspaces monorepo).

**Performance Goals**: cold start to a usable dashboard < 3 s on a 2023 mid-range phone (SC-004); the
dashboard reflects a saved meal < 1 s (SC-003); food search answers while typing, < 300 ms per query
against the dev project.

**Constraints**: Turkish UI only; no web front end; no secrets in the app (only the Supabase URL and
the publishable key); every table under RLS; grams > 0 and ≤ 5000; calorie floor 1200/1500.

**Scale/Scope**: 15 screens ([contracts/screens.md](./contracts/screens.md)), 6 tables, 4 RPC
functions, about 80 seeded foods; sized for the first few thousand users.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
|---|---|---|
| I. Layered mobile architecture | `apps/mobile` (app → components → hooks/providers → services → core), `packages/core` pure, `supabase/` for SQL; ESLint `no-restricted-imports` per layer | Pass |
| II. Validated boundaries | Core Zod schemas validate RPC payloads before sending and every row read; generated DB types for the client | Pass |
| III. Server-owned numbers | Meal totals and item snapshots by triggers; plan floor and macro sum checked by a trigger; `local_date` + `time_zone` stored | Pass |
| IV. User confirms the grams | Review step with an empty gram field on the only logging path in 001 | Pass |
| V. One AI boundary | No AI in 001; nothing that would bypass the future boundary | Pass (n/a) |
| VI. Only code we use | Next.js app, Prisma, server code and unused lib modules deleted; knip in CI per workspace | Pass |
| VII. Turkish first | All copy Turkish with "sen"; search folds Turkish characters and suffixes | Pass |
| VIII. Secure by default | RLS on all six tables, writes via `security definer` RPCs with `auth.uid()` checks, column privilege on `onboarding_completed`, session in secure storage | Pass |
| IX. Tested and measured | Core unit + property tests, DB tests with two users, Maestro smoke flow, CI gates | Pass |

Post-design re-check (after data model and contracts): no new violations; no complexity tracking
needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-mobile-foundation/
├── plan.md              # This file
├── research.md          # Phase 0: decisions on auth, storage, monorepo, search, testing
├── data-model.md        # Phase 1: tables, RLS, triggers
├── quickstart.md        # Phase 1: how to run and validate the slice
├── contracts/
│   ├── database-api.md  # RPC functions, access matrix, reads
│   └── screens.md       # routes, redirects, deep links
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
package.json                 # npm workspaces: apps/*, packages/*; root scripts run every workspace
apps/mobile/
├── app.config.ts            # name "Kalori Takip", scheme kaloritakip, iOS/Android ids, plugins
├── eas.json                 # development / preview / production profiles
├── metro.config.js
├── eslint.config.js         # eslint-config-expo + layer rules
├── assets/                  # icon, splash
└── src/
    ├── app/                 # expo-router: _layout.tsx (session + redirects), (auth)/, (setup)/, (tabs)/, log/, meal/, day/, plan/
    ├── components/
    │   ├── ui/              # Button, TextField, Ring, MacroBar, Sheet, Segmented, Slider, EmptyState, ErrorState…
    │   └── auth/ setup/ dashboard/ meals/ history/ plan/
    ├── hooks/               # useSession, useProfile, useActivePlan, useDayMeals, useFoodSearch, useLogMeal, usePlanWizard, usePlanTuner, useOnboarding, useToday (midnight rollover)
    ├── providers/           # QueryProvider, SessionProvider, ToastProvider
    ├── services/            # supabase.ts (client + session storage), authService, profileService, planService, mealService, foodService
    └── theme.ts             # tofuhq tokens: ink, lime, surfaces, spacing (4 px grid), radii, type
packages/core/
├── package.json             # "@calorie/core", exports ./nutrition, ./schemas, ./search, ./dates, ./labels
├── src/
│   ├── nutrition/           # plan, planTuning, onboarding, targets, macros, slots, dayRating, energy (from src/lib/nutrition)
│   ├── schemas/             # zod, nutrition, plan, profile, onboarding, meal, rpc (from src/types + new RPC payloads)
│   ├── search/normalize.ts  # normalizeTr, searchStems (new; built from quickParse's alias handling)
│   ├── db/database.types.ts # generated by the Supabase CLI
│   ├── dates.ts
│   └── labels.ts
└── tests/                   # carried-over unit tests + plan property tests + normalize tests
supabase/
├── config.toml
├── migrations/              # schema + RLS, triggers, RPC functions, curated foods seed
└── tests/                   # node:test suites against the dev project (two users)
.maestro/smoke.yaml
```

Deleted in this feature: `src/` (Next.js app, components, hooks, server, services), `prisma/`,
`next.config.ts`, `postcss.config.mjs`, the root `eslint.config.mjs` and `tsconfig.json` (replaced
per workspace) and `ml/`. `tofuhq-design/` stays as the design reference for the theme. Core modules
for later features (schedule, fasting, water, weight, trends, insights, micros, quickParse,
labelParse, the foods list, plateName, csv) are not carried over; the foods list becomes the seed
migration.

**Structure Decision**: npm-workspaces monorepo with `apps/mobile`, `packages/core` and `supabase/`,
the shape the constitution requires and the owner's other Expo project (mybike) already uses.

## Complexity Tracking

No violations.
