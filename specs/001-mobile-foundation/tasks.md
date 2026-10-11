---

description: "Task list for 001 Mobile Foundation"
---

# Tasks: Mobile Foundation

**Input**: Design documents from `/specs/001-mobile-foundation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The constitution (IX) requires unit and property tests for `@calorie/core`,
database tests for RLS, triggers and RPCs, and a Maestro smoke flow. Database tests are written
before the migration they cover and must fail first.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story from spec.md (US1–US5)
- Paths: `apps/mobile/`, `packages/core/`, `supabase/` per plan.md

## Owner inputs needed during this feature

- Before T017: a Supabase **dev** project (URL, publishable key, service-role key).
- Before T006 builds: an Expo account; the app's bundle ID / package name (placeholder
  `com.kaloritakip.app` until decided).
- Before T026: Google OAuth clients (web, iOS, Android + SHA-1); before T027: Apple Developer
  membership with Sign in with Apple enabled for the bundle ID.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Turn the Next.js repository into the monorepo from plan.md.

- [x] T001 Convert the root `package.json` into an npm-workspaces root (`apps/*`, `packages/*`, `supabase`): root scripts `test`, `typecheck`, `lint`, `knip`, `mobile` that run per workspace; `overrides` pinning one `react` 19.2.3; remove Next.js, Prisma, sharp, tesseract.js, transformers, zxing, motion, lucide-react and Tailwind dependencies
- [x] T002 Create `packages/core` (`package.json` name `@calorie/core`, `"type": "module"`, `exports` for `./nutrition/*`, `./schemas/*`, `./search/*`, `./dates`, `./labels`; `tsconfig.json` strict) and `git mv` the kept modules: `src/lib/nutrition/{plan,planTuning,onboarding,targets,macros,slots,dayRating,energy}.ts` → `packages/core/src/nutrition/`, `src/lib/{dates,labels}.ts` → `packages/core/src/`, `src/types/{zod,nutrition,plan,profile,onboarding,meal}.ts` → `packages/core/src/schemas/`; rewrite `@/` imports as relative imports with `.ts` extensions (Deno-compatible for 003)
- [x] T003 Move the tests of kept modules from `tests/` to `packages/core/tests/` (plan, onboarding, routes→drop, schedule→drop, settings→drop, fasting→drop, food/label/vision→drop), run them with `tsx --test`, and make them pass against the moved modules
- [x] T004 Delete the web app: `src/`, `prisma/`, `tests/`, `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, root `eslint.config.mjs` and `tsconfig.json`, root `.env.example`, `ml/`; trim `.gitignore` to the monorepo; confirm `npm run knip` reports nothing in `packages/core`
- [x] T005 [P] Create `apps/mobile` with `npx create-expo-app@latest --template default@sdk-57`, keep expo-router with `src/app/`, `typedRoutes`, strict `tsconfig.json` with `@/*` → `src/*`; install via `npx expo install`: expo-secure-store, @react-native-async-storage/async-storage, expo-localization, expo-apple-authentication, expo-crypto, react-native-svg, expo-font, @supabase/supabase-js, @tanstack/react-query, aes-js, react-native-get-random-values; add `@calorie/core` as a workspace dependency
- [x] T006 [P] Write `apps/mobile/app.config.ts` (name "Kalori Takip", slug, scheme `kaloritakip`, iOS `bundleIdentifier` / Android `package` placeholder, `ios.usesAppleSignIn`, plugins for expo-router, expo-secure-store, expo-apple-authentication, @react-native-google-signin/google-signin with `iosUrlScheme` from env) and `apps/mobile/eas.json` (development, preview, production profiles)
- [x] T007 [P] Initialize `supabase/` with `npx supabase init` (`supabase/config.toml`) and a `supabase/package.json` workspace (`test` script: `tsx --test tests/*.test.ts`)
- [x] T008 [P] Configure linting: `apps/mobile/eslint.config.js` = eslint-config-expo + `no-restricted-imports` enforcing app → components → hooks/providers → services → @calorie/core (components/ui may not import hooks or services; nothing outside `services/` imports `@supabase/supabase-js`); `packages/core` lint forbids react, react-native and @supabase imports; root `knip.json` covering all workspaces
- [x] T009 [P] Rewrite `.github/workflows/ci.yml`: Node 22, `npm ci`, then `typecheck`, `lint`, `knip`, `npm test -w @calorie/core`; a separate job runs `npm test -w supabase` only when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets exist
- [x] T010 [P] Port the tofuhq tokens from the old `src/app/globals.css` (via `git show`) to `apps/mobile/src/theme.ts` (colors: ink, lime, surfaces, text, semantic; spacing on the 4 px grid; radii; type scale) and load the display font with expo-font (owner's choice 2026-10-09: Bricolage Grotesque Bold from `@expo-google-fonts/bricolage-grotesque`, replacing Space Grotesk)

- [x] T061 [P] Screen review tool `tools/preview` (never shipped): renders the app's real components with react-native-web and fake services (`@/services/*` resolved to `tools/preview/src/fakes/*` in `tools/preview/metro.config.js`), one 390×844 phone frame per screen in `tools/preview/src/PreviewGallery.tsx`; `npm run preview` exports it and `tools/preview/scripts/to-artifact.mjs` writes `dist/artifact.html` with relative URLs for a claude.ai artifact. Every phase that adds screens adds them to the gallery and republishes

**Checkpoint**: `npm install`, `npm run typecheck`, `npm run lint`, `npm run knip` and core tests pass; the Expo app exports an Android bundle; the preview artifact shows the placeholder screen and the theme.

Notes from Phase 1: dependencies listed in T005 that nothing imports yet were removed again to keep knip clean (constitution VI); each one is installed by the task that first uses it (T019 session storage, T020 query client, T027 expo-crypto, T037 react-native-svg). The Google sign-in plugin is added in T026 with its client IDs.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, security, shared logic and the app shell every story needs.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T011 Write `supabase/tests/helpers.ts`: admin client from env, `createTestUser()` / `deleteTestUser()` via the admin API, `clientFor(user)` signed in through supabase-js, cleanup in `after()` hooks
- [x] T012 Write `supabase/tests/rls.test.ts` (must fail first): with users A and B, B cannot select, update or delete A's rows in `profiles`, `nutrition_plans`, `meals`, `meal_items`; anonymous clients read nothing; `foods`/`food_aliases` are readable but not writable
- [x] T013 Migration `supabase/migrations/20261009000100_schema.sql`: enums, the six tables from data-model.md with checks and indexes, RLS enabled with the policies from contracts/database-api.md, `revoke update (onboarding_completed)` on `profiles` from `authenticated`, `pg_trgm` extension
- [x] T014 Migration `supabase/migrations/20261009000200_triggers.sql`: `handle_new_user` (insert profile on `auth.users` insert), `meal_items` before-trigger (set `user_id` from the meal, reject foreign meals, copy the per-100 g snapshot from `foods`), after-trigger recomputing the meal's four totals, `nutrition_plans` validation trigger (per-day floor by sex, macro sum within max(10 kcal, 1 %)), `updated_at` touch triggers
- [x] T015 Apply migrations to the dev project (`npx supabase link`, `npx supabase db push`), generate `packages/core/src/db/database.types.ts` with `npx supabase gen types typescript --linked`, and make T012 pass
- [x] T016 [P] Fix the plan engine floor in `packages/core/src/nutrition/plan.ts` (every cycling day ≥ the sex floor; the summary and weeks-to-goal use the real deficit `base.calories − tdee`) and in `packages/core/src/nutrition/planTuning.ts` (calorie slider minimum = sex floor; macros never exceed calories)
- [x] T017 [P] Property tests `packages/core/tests/plan.property.test.ts` with fast-check: for any valid `PlanInputs`, every day (base, training, rest) ≥ floor and protein·4 + carbs·4 + fat·9 = calories within rounding; for any tuning action the same holds (SC-006)
- [x] T018 [P] RPC payload and row schemas in `packages/core/src/schemas/rpc.ts` (onboarding answers, plan payload, log-meal payload, search row) and `packages/core/src/schemas/rows.ts` (profile, plan, meal, meal item rows mapped from `database.types.ts`)
- [x] T019 `apps/mobile/src/services/supabase.ts`: client with the LargeSecureStore adapter (AES key in SecureStore, ciphertext in AsyncStorage), `autoRefreshToken` started/stopped on `AppState`, env from `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_KEY`; `apps/mobile/.env.example`
- [x] T020 [P] Providers in `apps/mobile/src/providers/`: `QueryProvider` (TanStack Query with `focusManager` on AppState), `ToastProvider`, `SessionProvider` (auth state from `supabase.auth.onAuthStateChange`, profile query)
- [x] T021 [P] UI primitives in `apps/mobile/src/components/ui/`: `Screen`, `Button` (primary lime on ink, secondary, ghost; loading state), `TextField` (label, error, numeric), `ErrorState`, `EmptyState`, `Toast`, `Sheet`; colors only from `theme.ts`
- [x] T022 Root layout `apps/mobile/src/app/_layout.tsx` with the redirect rules from contracts/screens.md (no session → welcome; unconfirmed e-mail → verify; setup incomplete → setup; else tabs) and the `(tabs)/_layout.tsx` tab bar (Bugün, Geçmiş, Planım, Profil). Done with expo-router `Stack.Protected` guards and an `index` anchor that redirects; routes are `/welcome`, `/setup/[step]`, `/today`, `/history`, `/plan`, `/profile` (placeholders until their stories)

**Checkpoint**: RLS tests pass against the dev project; the app opens to the welcome route when signed out.

Note: `Sheet` and `useToast` have no caller until US1, so knip reports them; Phase 2 and US1 go out as one pull request.

Note (2026-10-09): until the dev project exists, the migrations were checked on a local PGlite database with a stubbed `auth` schema (29 checks: RLS for two users and anonymous, column privileges, totals trigger, Turkish normalization, plan floor and macro sum, one active plan). That check is not part of the repository; T015 runs the real suite.

Note (2026-10-11): T015 done on the dev project `kalori-takip-dev` through the Supabase MCP (no CLI link); the T011/T012 node suite needed a service-role key and is replaced by pgTAP files in `supabase/tests/database/` (research.md §7), which is also where the later database test tasks (T023, T032, T040, T041) go; `20261011000100_function_privileges.sql` revokes execute on every `public` function, so each RPC grants it to `authenticated` explicitly.

---

## Phase 3: User Story 1 - Create an account and stay signed in (Priority: P1) 🎯 MVP

**Goal**: E-mail, Google and (iOS) Apple accounts that persist across restarts; sign out; password reset.

**Independent Test**: On a clean device, create an account with each method offered on that
platform, reopen the app (still signed in), sign out (nothing personal left), reset a password.

### Tests for User Story 1

- [ ] T023 [P] [US1] `supabase/tests/profiles.test.ts`: signing up creates exactly one profile with `onboarding_completed = false`; a user can update their own profile fields but not `onboarding_completed`

### Implementation for User Story 1

- [ ] T024 [US1] `apps/mobile/src/services/authService.ts`: e-mail sign-up (with `emailRedirectTo` = `kaloritakip://auth/confirm`), sign-in, sign-out, `resetPasswordForEmail` (redirect `kaloritakip://auth/reset`), `updatePassword`; errors mapped to Turkish messages
- [ ] T025 [US1] `apps/mobile/src/hooks/useSession.ts` and `useAuthForm.ts`: session state, form validation (e-mail, password ≥ 8), pending/error states
- [ ] T026 [US1] Google sign-in in `authService.ts` with `@react-native-google-signin/google-signin` (`webClientId`, `iosClientId` from env) → `signInWithIdToken({ provider: 'google' })`
- [ ] T027 [US1] Sign in with Apple (iOS only) in `authService.ts` with `expo-apple-authentication` and a nonce (SHA-256 to Apple, raw to Supabase via `expo-crypto`); save the full name on first sign-in with `updateUser`
- [ ] T028 [P] [US1] Screens `apps/mobile/src/app/(auth)/welcome.tsx`, `sign-in.tsx`, `sign-up.tsx` (with the "E-postanı doğrula" state), `reset-password.tsx` and components in `apps/mobile/src/components/auth/`; the Apple button renders only on iOS
- [ ] T029 [US1] Deep-link handling for `kaloritakip://auth/confirm` and `kaloritakip://auth/reset` (exchange the code for a session) in `apps/mobile/src/app/(auth)/` routes
- [ ] T030 [US1] `apps/mobile/src/app/(tabs)/profile.tsx`: account e-mail, sign-in methods, "Çıkış yap" that signs out and clears the query cache and secure storage (FR-005)
- [ ] T031 [US1] Document the dashboard setup (e-mail confirmation on, redirect URLs, Google and Apple providers with client IDs) in `supabase/README.md`

**Checkpoint**: US1 works on an Android emulator (e-mail, Google) and an iPhone (all three).

---

## Phase 4: User Story 2 - First-time setup gives personal daily targets (Priority: P1)

**Goal**: A resumable setup that stores the profile and an active formula plan; the dashboard shows the targets.

**Independent Test**: Complete the setup with known answers; the dashboard targets equal
`buildPlan` for those answers; killing the app mid-setup resumes at the same step.

### Tests for User Story 2

- [ ] T032 [P] [US2] `supabase/tests/onboarding.test.ts` (fail first): `complete_onboarding` stores the profile and one active plan and sets the flag; a second call returns `already_completed`; a plan below the floor returns `plan_below_floor`; `save_plan` deactivates the previous plan; direct inserts into `nutrition_plans` are refused

### Implementation for User Story 2

- [ ] T033 [US2] Migration `supabase/migrations/20261009000300_onboarding_rpcs.sql`: `complete_onboarding(answers, plan)` and `save_plan(plan)` as `security definer` with `auth.uid()` checks and the error codes from contracts/database-api.md
- [ ] T034 [P] [US2] `apps/mobile/src/services/profileService.ts` (read profile, save partial setup answers) and `planService.ts` (`completeOnboarding`, `savePlan`, `getActivePlan`), validating payloads and rows with `@calorie/core` schemas
- [ ] T035 [US2] `apps/mobile/src/hooks/useOnboarding.ts`: steps from contracts/screens.md, validation with core `PROFILE_LIMITS`, each answer saved to the profile so the setup resumes at the first unanswered step, final step builds the plan with core `onboardingToPlanInputs` + `buildPlan` and calls `completeOnboarding`
- [ ] T036 [US2] Setup screens `apps/mobile/src/app/(setup)/[step].tsx` and `apps/mobile/src/components/setup/` (choice cards, number fields, summary with the computed targets)
- [ ] T037 [P] [US2] `apps/mobile/src/components/ui/Ring.tsx` (react-native-svg calorie ring) and `MacroBar.tsx`
- [ ] T038 [US2] `apps/mobile/src/hooks/useActivePlan.ts` + `useTargets.ts` (core `resolveTargets` for today) and the first version of `apps/mobile/src/app/(tabs)/index.tsx` showing today's targets

**Checkpoint**: US1 + US2: a new user reaches a dashboard with correct targets in under 3 minutes (SC-001).

---

## Phase 5: User Story 3 - Log a meal by searching a food (Priority: P1)

**Goal**: Search, mandatory gram review, save, edit and delete; the dashboard follows within a second.

**Independent Test**: Log three foods into two meals, edit one amount, delete one meal; dashboard
totals always equal the remaining items.

### Tests for User Story 3

- [ ] T039 [P] [US3] `packages/core/tests/normalize.test.ts`: `normalizeTr` folds İ/I/ı/Ç/Ğ/Ö/Ş/Ü and lower-cases; `searchStems("tavuğu")` includes "tavuk"; fixture list exported for the parity test
- [ ] T040 [P] [US3] `supabase/tests/meals.test.ts` (fail first): `log_meal` computes totals from the seeded foods and ignores nutrition values in the payload; editing grams and deleting items recompute totals; grams 0 / 5001 rejected; a meal on another user's id is refused; `date_out_of_range` outside ±1 day
- [ ] T041 [P] [US3] `supabase/tests/search.test.ts` (fail first): `search_foods('tavuğu tavuk')` returns the chicken food first; `normalize_tr` equals core `normalizeTr` on the fixture list; results capped at 50

### Implementation for User Story 3

- [ ] T042 [P] [US3] `packages/core/src/search/normalize.ts`: `normalizeTr` and `searchStems` (Turkish suffix candidates, built from the old quickParse alias handling via `git show`)
- [ ] T043 [US3] Migration `supabase/migrations/20261009000400_search.sql`: `search_foods(q, max_results)` (`normalize_tr`, the generated `alias_normalized` column and its trigram index already ship with the schema migration, T013, because the table depends on them)
- [ ] T044 [US3] Migration `supabase/migrations/20261009000500_log_meal.sql`: `log_meal(slot, local_date, time_zone, name, items)` with the error codes from contracts/database-api.md
- [ ] T045 [US3] Migration `supabase/migrations/20261009000600_seed_curated_foods.sql`: the ~80 curated foods and aliases from the old `src/lib/nutrition/foods.ts` (via `git show`), with the corrected values from the review (kaşar, white bread, simit) and slug ids
- [ ] T046 [US3] `apps/mobile/src/services/foodService.ts` (`search`) and `mealService.ts` (`logMeal`, `updateItemGrams`, `removeItem`, `deleteMeal`, `getDayMeals`), validating rows with core schemas
- [ ] T047 [US3] Hooks `apps/mobile/src/hooks/useFoodSearch.ts` (debounced, stems), `useLogMeal.ts` (keeps the draft on failure, Turkish error, invalidates the day query), `useDayMeals.ts`, `useToday.ts` (local date from expo-localization; switches at local midnight and on app resume)
- [ ] T048 [US3] Screens `apps/mobile/src/app/log/search.tsx`, `log/review.tsx` (empty gram field, 0 < g ≤ 5000, live totals with core `itemMacros`, slot defaulting from core `slotForHour`), `meal/[id].tsx`, and components in `apps/mobile/src/components/meals/`
- [ ] T049 [US3] Dashboard in `apps/mobile/src/app/(tabs)/index.tsx` + `apps/mobile/src/components/dashboard/`: ring and macro bars from today's meals vs targets, meals grouped by slot, add button, empty state

**Checkpoint**: US1–US3 form the MVP: sign up, set up, log by search, see the day.

---

## Phase 6: User Story 4 - Build and fine-tune a plan in the wizard (Priority: P2)

**Goal**: The four-step wizard with live preview, the tuning step and saving the active plan.

**Independent Test**: Plan with cycling on 4 days; adjust protein with "Kalori sabit"; save; today's
targets show the training or rest day.

- [ ] T050 [P] [US4] Port `usePlanWizard` and `usePlanTuner` from the old `src/hooks/` (via `git show`) to `apps/mobile/src/hooks/`, using core for all math and reading `sensitive_warning_ack` from the profile
- [ ] T051 [P] [US4] `apps/mobile/src/components/ui/Slider.tsx` and `Segmented.tsx`
- [ ] T052 [US4] Screens `apps/mobile/src/app/plan/wizard.tsx` (4 steps + live preview) and `plan/review.tsx` (calorie and macro sliders, "Kalori sabit", training/rest tabs, "Aktif planım yap" → `savePlan`), components in `apps/mobile/src/components/plan/`
- [ ] T053 [US4] Sensitive-content notice for 16:8 or a deficit ≥ 750 kcal with the gentler option; acknowledgement saved to `profiles.sensitive_warning_ack`
- [ ] T054 [US4] `apps/mobile/src/app/(tabs)/plan.tsx` (active plan summary, "Planı düzenle", "Yeni plan") and the training/rest day label on the dashboard

**Checkpoint**: The plan from the wizard drives the dashboard; the floor holds for every day.

---

## Phase 7: User Story 5 - Look back at previous days (Priority: P3)

**Goal**: A month calendar with on-target marks and a day detail.

**Independent Test**: Meals on three days; the calendar marks match ±5 % of each day's target; each day opens.

- [ ] T055 [US5] `mealService.getMonthTotals` and `apps/mobile/src/hooks/useMonthCalendar.ts` (per-day sums, core `rateDay` against that day's targets)
- [ ] T056 [US5] `apps/mobile/src/app/(tabs)/history.tsx` (calendar, months back/forward) and `apps/mobile/src/app/day/[date].tsx` (meals and totals vs that day's targets), components in `apps/mobile/src/components/history/`

**Checkpoint**: All five stories work independently.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T057 Maestro smoke flow `.maestro/smoke.yaml`: sign up with a fresh e-mail (confirmation off on the dev project for test addresses), complete setup, search "tavuk", log 150 g, assert the ring value
- [ ] T058 [P] Rewrite `CLAUDE.md` for the mobile monorepo (layers, commands, conventions, Turkish copy rules) and `README.md` (setup from quickstart.md); remove the Next.js block from `AGENTS.md`
- [ ] T059 [P] Accessibility pass: labels on icon buttons, touch targets ≥ 44 pt, text contrast on ink and white, dynamic type does not clip the ring or forms
- [ ] T060 Run the full quickstart.md validation on an Android emulator and an iPhone; record results and any deviations in `specs/001-mobile-foundation/checklists/validation.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none. T001 → T002 → T003 → T004 in order; T005–T010 in parallel after T001.
- **Foundational (Phase 2)**: after Setup. T011 → T012 → T013 → T014 → T015; T016–T018 in parallel
  with the SQL work; T019 → T020 → T022; T021 in parallel.
- **User stories**: after Foundational, in priority order. US2 needs a signed-in user (US1).
  US3 needs a set-up user (US2) to reach the dashboard. US4 and US5 need US3's dashboard and meals.
- **Polish**: after the stories it covers; T057 after US3.

### Within each story

Database tests are written first and fail; then migrations; then services; then hooks; then screens.

### Parallel opportunities

- Setup: T005, T006, T007, T008, T009, T010.
- Foundational: T016, T017, T018 (core) alongside T013–T015 (SQL); T020, T021.
- US3: T039, T040, T041 (tests) and T042 (core) together, before the migrations.
- US4: T050 and T051.

## Parallel Example: User Story 3

```text
Task: "T039 normalize tests in packages/core/tests/normalize.test.ts"
Task: "T040 meal trigger and RPC tests in supabase/tests/meals.test.ts"
Task: "T041 search tests in supabase/tests/search.test.ts"
Task: "T042 normalizeTr and searchStems in packages/core/src/search/normalize.ts"
```

## Implementation Strategy

### MVP first (US1 → US2 → US3)

1. Phases 1–2: monorepo, schema, RLS, shell.
2. US1: accounts. Validate on both platforms.
3. US2: setup and targets. Validate SC-001.
4. US3: search logging and dashboard. **Stop and validate the MVP** (SC-002, SC-003, SC-005).

### Then

5. US4 (wizard), US5 (history), Polish. Each ends at its checkpoint and goes out as its own pull
   request: setup + foundation, US1, US2, US3, US4, US5, polish.
