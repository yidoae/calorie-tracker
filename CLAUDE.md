@AGENTS.md

# Calorie Tracker

Mobile-first web app for logging meals. Users sign up with a username + password. A meal is logged by (a) snapping/uploading a photo, which is broken down into its components with editable portions, or (b) typing free text in the quick bar ("Öğlen 200g ızgara tavuk, bol salata ve 1 dilim tam buğday ekmeği"). The dashboard shows today's calories and macros as progress rings, a smart daily summary, the meal list, a calendar history and the active nutrition plan. Plans are built in a 4-step wizard at `/plan` (formula plan + live fine-tuning). Desktop is a 3-column layout (calendar · today · profile); on phones the columns become tabs.

**Stack:** Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · Zod 4 · Prisma 6 + SQLite · `@node-rs/argon2` · Lucide icons · transformers.js (CLIP + SlimSAM) for photos · local Ollama for the quick-bar matcher.

## Status: moving to a mobile app (read this first)

The product is becoming a **native iOS and Android app (Expo SDK 57, expo-router) on Supabase**, with **no web front end**. Everything below this section describes the **current Next.js web app**, which is being retired; do not build new features on it.

- **Rules:** `.specify/memory/constitution.md` (v2.0.1) wins over this file. Monorepo: `apps/mobile` (Expo app), `packages/core` (`@calorie/core`: pure nutrition logic + Zod schemas, shared by the app and Edge Functions), `supabase/` (migrations, Row Level Security on every table, Edge Functions). Accounts: Supabase Auth with e-mail, Google, and Sign in with Apple on iOS only.
- **Plan of work:** `specs/ROADMAP.md`: 001 mobile foundation → 002 food database + barcode → 003 AI logging → 004 tracking → 005 account and stores → 006 subscription (RevenueCat).
- **Current feature:** `specs/001-mobile-foundation/` (spec, plan, research, data model, contracts, quickstart, `tasks.md` with 60 tasks). Its Phase 1 deletes this Next.js app and moves the kept logic into `packages/core`; T058 then rewrites this file for the monorepo.
- **AI:** one hosted vision model behind one Edge Function, chosen on a Turkish food eval set; the owner decided to start with **Gemini** (paid tier for users, free tier only for development). No on-device or in-process models, no Ollama.
- **Out of scope:** FitBot, the AI plan strategy, any website.
- **Progress:** Phase 7 of 001 (US5, history) is implemented but not device-tested: `(tabs)/history` shows a Monday-first month calendar (back to earlier months, not past the current one) where each logged day is marked on target (±5 %), under or over against the plan in effect that day (`planService.getPlans` + `hooks/historyLogic.ts`), and `day/[date]` shows that day's ring, bars and meals with the dashboard components. Phase 6 of 001 (US4, plan wizard) is implemented and its slider was checked on a phone: `(tabs)/plan` shows the active plan (weekly average, training/rest tiles with today's type, routine) with "Planı düzenle" → `plan/review` and "Yeni plan" → `plan/wizard`; the wizard has four steps (vücut ve hedef → antrenman → beslenme ve öğün düzeni → kalori döngüsü) with a live preview from the core engine and starts from the active plan's answers (sex always from the profile); 16:8 or a deficit ≥ 750 kcal first opens the sensitive-content sheet with the gentler option, remembered in `profiles.sensitive_warning_ack`; `plan/review` tunes calories and macros with sliders ("Kalori sabit", training/rest tabs) and saves through `savePlan` → `save_plan`; core `tunedPlan` makes a cycling plan's base its weekly average, property-tested over any slider moves. `ui/Slider` (no native dependency) and `ui/Segmented` are new. Phase 5 of 001 (US3, log a meal by searching) is implemented but not device-tested: `log/search` (modal, results while typing; core `searchQuery` sends the typed words plus Turkish suffix stems, "tavuğu" → "tavuk") → `log/review` (an empty gram field per food, 0 < g ≤ 5000, live totals, slot from the time of day; the draft survives a failed save) → `log_meal`; `meal/[id]` changes grams, removes items and deletes the meal; `(tabs)/today` shows the ring and macro bars from today's meals and the meals by slot. Database: `search_foods` and `log_meal` (`20261011000300`/`400`, `security definer` bodies in `private`) and the 79 curated foods (`20261011000500`; kaşar, white bread and simit corrected with TÜRKOMP-range values the owner should verify); pgTAP `meals.test.sql` and `search.test.sql`; core `normalizeTr` is checked against SQL `normalize_tr` on a shared fixture list. Phase 4 of 001 (US2, first-time setup) is implemented but not device-tested: a six-step setup (`setup/[step]`: cinsiyet ve yaş → boy ve kilo → hedef kilo → hareket → beslenme tarzı → özet) saves each step's answers to the profile and resumes at the first unanswered step; the summary builds the plan with the core engine and `complete_onboarding` stores profile and plan in one step; `(tabs)/today` shows today's targets as a calorie ring and macro bars (react-native-svg). The RPCs `complete_onboarding` and `save_plan` (`20261011000200_onboarding_rpcs.sql`) keep their `security definer` bodies in the unexposed `private` schema behind `security invoker` wrappers in `public` (see `supabase/README.md`); the app's `savePlan` is used by the plan wizard (US4). Phase 3 of 001 (US1, accounts) is implemented but not device-tested: e-mail sign-up with confirmation, sign-in, password reset through `kaloritakip://auth/*` deep links (PKCE), Google (hidden until `EXPO_PUBLIC_GOOGLE_*` client IDs are set) and Apple on iOS, profile with sign-out; `npm test -w mobile` runs the app's pure helpers with node:test; the Auth dashboard settings and the Google/Apple accounts are owner TODOs listed in `supabase/README.md`. Phase 2 of 001 is done, T015 included: the Supabase dev project `kalori-takip-dev` (ref `hhymtqbugbeiqszcpyai`) has the migrations (schema, RLS, triggers, function privileges: every RPC must grant execute to `authenticated`); database tests are pgTAP files in `supabase/tests/database/` (see `supabase/README.md`); `packages/core/src/db/database.types.ts` is generated; plus the plan-floor fix with property tests, the mobile row schemas, the encrypted session client, providers, UI primitives and session-guarded routing (`Stack.Protected`). Phase 1 of 001 is done: the Next.js app is deleted; `packages/core` holds the moved logic (`npm test -w @calorie/core`); `apps/mobile` is the Expo shell (`npm run mobile`, `npx expo export --platform android` to check it builds); `supabase/` is initialized. Everything below the "Decisions for 001" list still describes the deleted web app until T058 rewrites this file.
- **Screen previews:** the owner has no emulator. `npm run preview` renders the app's real screens with react-native-web and fake services in `tools/preview` (review only, never shipped) and writes `tools/preview/dist/artifact.html`, which is published as a claude.ai artifact. Add every new screen to `tools/preview/src/PreviewGallery.tsx` and republish when a phase adds screens.
- **Expo rules for agents:** `apps/mobile/AGENTS.md` (always use versioned SDK 57 docs and `npx expo install`).
- **Typeface:** the display face is **Bricolage Grotesque Bold** (owner's choice, 2026-10-09; replaces Space Grotesk), loaded from `@expo-google-fonts/bricolage-grotesque` through `fontAssets` in `apps/mobile/src/theme.ts`; body text uses the system font. The owner compared it with Fraunces, Nunito and Helvetica in the preview and kept Bricolage (2026-10-09).
- **Workflow:** Spec Kit skills in `.claude/skills/` (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`); small pull requests, one phase or story each.

### Decisions for 001 (details in `specs/001-mobile-foundation/`)

- **Server logic without Edge Functions in 001** ([plan.md](specs/001-mobile-foundation/plan.md), [data-model.md](specs/001-mobile-foundation/data-model.md)): six tables (`profiles`, `nutrition_plans`, `foods`, `food_aliases`, `meals`, `meal_items`), RLS on all of them. Triggers create the profile on sign-up, copy each item's per-100 g values from `foods`, recompute meal totals, and reject plans below the floor (1200 kcal women / 1500 kcal men) or whose macros don't add up to the calories. Atomic writes are `security definer` RPCs: `complete_onboarding`, `save_plan`, `log_meal`, `search_foods` ([contracts/database-api.md](specs/001-mobile-foundation/contracts/database-api.md)). The app never sends nutrition values or totals.
- **Screens and routing** ([contracts/screens.md](specs/001-mobile-foundation/contracts/screens.md)): 15 expo-router routes; the root layout alone decides access (no session → welcome, unconfirmed e-mail → verify, setup incomplete → setup, else tabs). Deep links use the `kaloritakip://` scheme.
- **Auth** ([research.md](specs/001-mobile-foundation/research.md) §1–4): session encrypted on the device (AES key in SecureStore, ciphertext in AsyncStorage) with auto refresh tied to AppState; Google through `@react-native-google-signin/google-signin` + `signInWithIdToken`; Apple natively on iOS only, with a nonce; same verified e-mail = same account (automatic identity linking). These need an EAS development build; Expo Go cannot load them.
- **Turkish search** (research §8): SQL `normalize_tr` (Turkish letters folded, lower-cased) with a `pg_trgm` index; the app adds suffix candidates with core `searchStems` ("tavuğu" → "tavuk"); a test keeps SQL `normalize_tr` and core `normalizeTr` identical.
- **Tests** (research §7, [quickstart.md](specs/001-mobile-foundation/quickstart.md)): core with `node:test` + fast-check property tests (every plan day ≥ floor, macros = calories); database tests in `supabase/tests/` run against a hosted Supabase **dev project** with two throwaway users (the Windows dev machine has no Docker, so no local Supabase or pgTAP); one Maestro smoke flow. Database tests are written before the migration they cover.
- **Code that moves and code that goes** (tasks Phase 1): kept modules move to `packages/core` (plan, planTuning, onboarding, targets, macros, slots, dayRating, energy, dates, labels and their schemas); the rest of the web app is deleted and restored from git history only when a later feature needs it. The curated food list becomes a seed migration with the corrected kaşar, white bread and simit values. The plan engine's floor bug (cycling rest days below the floor) is fixed in T016.
- **App conventions:** layer rules enforced by ESLint `no-restricted-imports`; only `services/` imports `@supabase/supabase-js`; colours only from `apps/mobile/src/theme.ts` (tofuhq tokens); Turkish copy with "sen". The bundle ID / package is the placeholder `com.kaloritakip.app` until the owner decides.
- **Owner inputs:** a Supabase dev project before T015, an Expo account and bundle ID before builds, Google OAuth clients before T026, Apple Developer membership before T027.

**Language:** the UI is Turkish (`<html lang="tr">`, `LOCALE = "tr-TR"` in `src/lib/dates.ts`). Write all user-facing text, API error messages and validation messages in Turkish. Code, comments and docs are English.

**Design system:** tofuhq (`tofuhq-design/SKILL.md`): ink `#170b21` header/hero band, white rounded panel, 1px `#222` card outlines, lime `#a8e40f` primary CTA, `#007aff` only for links/focus/active. Tokens and component classes (`card`, `btn-*`, `input`, `alert-*`, …) live in `src/app/globals.css`; never hard-code a colour that isn't a token there. 4 px grid; no blur; disabled states use muted colours, not opacity; animations respect `prefers-reduced-motion`.

> Next.js here is a newer version than most training data. Before changing framework-level code, read the matching guide in `node_modules/next/dist/docs/` (see AGENTS.md).

## Getting started

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env        # DATABASE_URL="file:./dev.db"
npm run db:migrate          # creates prisma/dev.db and applies migrations
npm run dev                 # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm test` | Unit tests in `tests/*.test.ts` (Node's `node:test` run through `tsx`; no extra test framework) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (route types like `RouteContext` are generated, so plain `tsc` fails on a clean checkout) |
| `npm run knip` | Unused files, exports and dependencies; must report nothing |
| `npm run db:migrate` | `prisma migrate dev`: create/apply migrations after editing `schema.prisma` |
| `npm run db:deploy` | `prisma migrate deploy`: apply existing migrations (production) |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:reset` | Drop and recreate the dev database |

## Architecture (non-negotiable rules)

The code is split into layers. Each layer may only import from the layers **below** it:

```
app/ (routes)          ← entry points only: pages and thin Route Handlers
components/            ← React UI
hooks/  providers/     ← client state and business flows
services/              ← client-side HTTP (the only place the browser calls fetch)
server/                ← server-only: DB, auth, AI, file storage (never imported by client code)
lib/                   ← pure, isomorphic logic (math, parsing, formatting); no I/O, no React
types/                 ← Zod schemas + inferred TypeScript types; imports nothing but zod
```

1. **UI components are dumb.** `components/ui/*` receive props and render. No `fetch`, no services, no business rules, no data mutation. Feature components (`components/<feature>/*`) may call hooks and pass the results to UI components, but still never call `fetch`/services directly and never compute nutrition themselves.
2. **State and business rules live in hooks.** One hook per concern: `useAuth`, `useNutritionPlan`, `useCalorieGoal`, `useMeals` (`useTodayMeals`, `useMealsInRange`, `useMealActions`), `useMealCapture`, `useMealReview`, `useQuickEntry`, `useDailyProgress`, the plan flow (`usePlanWizard`, `usePlanBuilder`, `usePlanTuner`), `useAuthForm` and small UI-state hooks (`useConfirm`, `useDisclosure`, `useDashboardLayout`). Context-backed hooks export a `use…Controller()` used once by the matching provider in `providers/`, plus the consumer hook.
3. **Services own HTTP.** `services/http.ts#request(url, schema, options)` is the only `fetch` wrapper in the browser: it maps network errors, `{ error }` responses and malformed payloads to `ApiError` (Turkish message, HTTP status) and validates every success payload against a Zod schema. Domain services (`authService`, `mealService`, `foodService`, `trackingService`, `accountService`) are thin wrappers around it.
4. **Route Handlers are thin.** Parse + validate input (`server/http.ts`: `readJson`, `validate`), check the session (`getCurrentUser`), call a `server/` function, map the result to a response. No SQL, no business logic in `app/api`. Error bodies are always `{ error: string }` (`types/api.ts`).
5. **All untrusted data passes a schema.** Request bodies, query strings, stored JSON (`User.settings`), AI model output (vision, label reader, quick-bar matcher) and API responses on the client are parsed with the Zod schemas in `types/`. Import `z` from `@/types/zod` (sets Turkish error messages), never directly from `"zod"` in schema files. Types are inferred from schemas (`z.infer`) so the two can't drift.
6. **Math is pure and single-sourced.** BMI (`lib/nutrition/energy.ts`), plan math (`lib/nutrition/plan.ts`: Harris-Benedict, activity, macros per diet style, calorie cycling, `buildPlan`; `planTuning.ts`: slider rebalancing), macro sums and portion scaling (`lib/nutrition/macros.ts`: `itemMacros`, `totalOfItems`), the food database (`lib/nutrition/foods.ts`), the quick-bar parser (`lib/nutrition/quickParse.ts`) and daily insights (`lib/nutrition/insights.ts`) are plain functions used by both client and server. The server always recomputes meal totals from items; never trust client totals.
7. **Graceful degradation.** Every dashboard section is wrapped in `<ErrorBoundary>` (one crash shows a "Tekrar dene" card, the rest keeps working). Every async action shows a loading state (skeleton, spinner or disabled button) and ends in feedback: `useToast()` for results (success/error/celebrate), inline `alert-*` for form errors. AI features degrade silently: no Ollama → the quick bar still works with the rule-based parser.
8. **Security.** Every data query is scoped to `userId` (`server/meals/repository.ts` is the only module that touches meal tables). Other users' meals/photos answer 404. Members-only UI actions go through `requireAuth(action)`, and the server enforces auth independently (401).

## Project structure

```
prisma/
  schema.prisma            User · Session · Meal (totals, userId) · MealItem (component: grams + nutrition per 100 g)
  migrations/              Committed migration history
src/
  app/
    layout.tsx, page.tsx   Shell (fonts, <AppProviders>) + "/": redirect only (member -> /panel, guest -> /giris). Paths live in `lib/routes.ts`
    giris/page.tsx         Landing page (motion scenes + athlete stories); members are redirected to /panel
    giris-yap/, kayit-ol/  Sign-in / sign-up pages (<AuthScreen />); `?sonra=/path` returns there afterwards (`safeReturnPath`, no open redirects)
    baslangic/page.tsx     Required first-time setup (<Onboarding />): age, sex, height, weight, goal weight, activity, diet + fat g/kg
    panel/page.tsx         <Dashboard />; guests may look around
    plan/page.tsx          Plan wizard (`?duzenle=1` opens the active plan in the tuning desk)
    gelisim/page.tsx       "Gelişim & Analiz": streaks, calories vs goal (7/30/90 days), macro averages
    kaynaklar/page.tsx     Sources for every formula and reference value
    globals.css            tofuhq tokens, component classes, animations
    api/
      auth/{register,login,logout,me}/route.ts   Account + session cookie
      me/route.ts                                DELETE account + all data (password-confirmed)
      me/settings/route.ts                       PUT saved profiles / custom plan / water goal / fasting window
      me/onboarding/route.ts                     POST first-time setup -> builds the formula plan server-side, sets onboardingCompleted
      me/export/route.ts                         GET ?format=json|csv data download
      meals/route.ts                             GET range · POST (multipart photo + `meal` JSON, or JSON from quick bar)
      meals/analyze/route.ts                     POST photo -> { name, items } breakdown (nothing saved)
      meals/parse/route.ts                       POST { text } -> quick-bar items (rule parser + local AI)
      meals/[id]/route.ts                        PATCH (name, slot, items) · DELETE
      meals/recent/route.ts                      GET latest distinct meals (one-tap re-log)
      saved-meals/route.ts, saved-meals/[id]     Meal templates: GET · POST · DELETE
      weights/route.ts, weights/[id]             Weigh-ins (one per local day): GET · POST · DELETE
      water/route.ts, water/[id]                 Water entries: GET range · POST · DELETE (undo)
      foods/barcode/[code]/route.ts              GET Open Food Facts product (cached in FoodProduct)
      foods/custom/route.ts, foods/custom/[id]   The user's own foods (CustomFood): GET · POST · DELETE
      foods/label/route.ts                       POST label photo -> per-100 g values read (vision model or OCR; nothing saved)
      uploads/[filename]/route.ts                GET photo (owner only)
  components/
    Dashboard.tsx          Composition root: calls hooks, passes props down
    ErrorBoundary.tsx      Section-level error boundary
    dashboard/             Panel cards (Lokma layout): DashboardIntro, EnergyCard (ring), MealsCard (by slot, item delete + undo), QuickAddCard, WeekCard
    ui/                    Dumb primitives: DashCard, LogoMark (animated brand ring), PortionControl, RangeSlider, Switch, ChoiceCard, CategoryChip, Toaster,
                           Dialog, ConfirmDialog, Segmented, EmptyState, MacroBar, MealThumb, Avatar, ErrorFallback
    layout/SiteHeader.tsx  Nav: animated brand, section pills (members), login/register or avatar + profile menu
    auth/                  GuardDialog ("Üyelik bulunamadı…"), AuthScreen (sign-in/up page + form), DeleteAccountDialog
    meals/                 MealCapture (photo flow), CameraView, MealReview (breakdown + sliders), QuickEntryBar, QuickPicks, MealEditDialog
    progress/              DailyInsights, WaterCard (glasses), MicroPanel
    history/               MealCalendar, DayDetail
    plan/                  PlanBuilder (/plan container), WizardProgress, StepBody/Training/Diet/Advanced, LivePreview,
                           PlanReview (tuning desk), MacroSliderRow
    profile/ActivePlanCard Dashboard card for the active plan (or the CTA to create one)
    landing/               Landing: IntroHero, LegendStories (useStoryPlayer), HowItWorks, FinalCall, MaskedWords; legends.ts (sourced athlete anecdotes)
  hooks/                   State + business flows (see rule 2)
  providers/               AppProviders -> ToastProvider -> AuthProvider (renders GuardDialog)
  services/                http.ts (request, ApiError), authService, mealService, foodService, trackingService, accountService
  server/
    db.ts, auth.ts         Prisma client · argon2id hashing, sessions, getCurrentUser
    accounts.ts            registerUser, authenticate, settings
    http.ts                apiError, unauthorized, readJson, validate
    rateLimit.ts, storage.ts
    meals/repository.ts    All meal/meal-item/saved-meal queries (user-scoped), DTO mapping
    tracking/repository.ts Weight and water queries (user-scoped)
    vision.ts              analyzeFoodImage: photo -> MealDraft (CLIP + SlimSAM, see "Photo recognition"), validated with mealDraftSchema
    food/                  recognize.ts (not-food guard), imageFeatures.ts + catalog.ts (sharp colour stats for the guard),
                           clip.ts (CLIP embeddings), foodRanking.ts (probe + zero-shot ranking), segment.ts (SlimSAM),
                           plate.ts (regions, grams), label.ts (label OCR / vision model), openFoodFacts.ts, customFoods.ts,
                           aiMatch.ts (LLM fallback for the quick bar), quickEntry.ts
    llm/                   config.ts (Ollama URL / model / vision model), ollama.ts (ollamaChat, parseJsonAnswer)
  lib/
    nutrition/             energy (BMI), macros, targets, plan, planTuning, schedule (plan periods), foods (food DB + micros), quickParse, labelParse, insights,
                           slots (meal slots, per-slot kcal shares), dayRating, micros, water, weight (trend, rate), trends (series, streaks)
    csv.ts                 CSV writer for the export
    labels.ts              Turkish UI labels
    dates.ts, photo.ts     Date helpers · browser-only photo helpers (resize, frame capture)
  types/                   zod.ts, nutrition.ts, meal.ts, food.ts, plan.ts, profile.ts (body limits), settings.ts, fasting.ts, tracking.ts, onboarding.ts, account.ts, auth.ts, api.ts
```

## How the main flows work

- **Photo → breakdown.** `useMealCapture` (camera or file) → `mealService.analyze` → `POST /api/meals/analyze` → `analyzeFoodImage` returns `{ name, items[] }` where each item has a category (protein/carb/fat…), grams, nutrition per 100 g and "Bu mu?" alternatives. `MealReview` shows one card per item with a gram field, a portion slider and ½×/1×/1½×/2× presets (`useMealReview`); totals update live via `totalOfItems`. Saving posts the photo + reviewed items; the server recomputes totals and stores items in `MealItem`.
- **Quick bar.** `useQuickEntry` runs `quickParse` (pure, `lib/nutrition/quickParse.ts`) on every keystroke for an instant preview. The parser splits on commas/"ve"/"ile", reads quantities ("200g", "1 dilim", "iki yemek kaşığı", "yarım porsiyon"), size words ("bol", "az") and meal-slot words ("öğlen" → "Öğle yemeği"), and matches foods by alias with Turkish suffix tolerance ("ekmeği" → "ekmek"). Unrecognised fragments are sent (debounced) to `POST /api/meals/parse`, where `aiMatch.ts` asks the local LLM to map them to food ids, constrained by a JSON schema and validated again. Enter logs the meal without a photo.
- **Progress.** `useDailyProgress` turns today's meals + targets into ring data (calories: goal met within ±5 %, red above +5 %; protein: minimum; carbs/fat: limits) and insights (`buildInsights`: e.g. "Bugün hedefine göre 25 g protein açığın var" + a concrete food suggestion that fits the remaining calories). When a goal is reached during the session, the ring pops, a check badge appears and a toast celebrates (not on page load).
- **Meal lists refresh** through a shared version counter in `useMeals` (`invalidateMeals()` after any mutation), so the today list and the calendar month refetch without prop drilling.
- **Plan wizard (`/plan`).** `usePlanWizard` holds the 4 steps (body + goal with deficit/surplus slider, training school + weekdays, diet style + meal pattern/16:8 window, calorie-cycling switch) and a live Harris-Benedict preview. "Planımı oluştur" (guarded) builds the plan in the browser with `buildPlan` (`lib/nutrition/plan.ts`: formula numbers + `formulaSummary`) and opens it in `PlanReview` (`usePlanTuner`): calorie slider, macro sliders with g/kg, "Kalori sabit" lock (moving one macro rebalances the others, `withMacro`), training/rest tabs when cycling. "Bu planı aktif planım yap" saves it to `User.settings.nutritionPlan` and returns to the dashboard. Dated periods (Cut, Bulk…) in `settings.planPeriods` replace the main plan between their dates (`lib/nutrition/schedule.ts`).
- **First-time setup (`/baslangic`).** New accounts have `User.onboardingCompleted = false` (accounts that existed before the migration were set to true). `requireOnboarded()` (`server/guards.ts`) in the /panel, /plan and /gelisim pages redirects them to /baslangic until `POST /api/me/onboarding` saves the answers; the server maps them to PlanInputs (`lib/nutrition/onboarding.ts`: goal from current vs goal weight, activity level -> training routine) and stores `buildPlan`'s result as the active plan.
- **Macro engine** (`lib/nutrition/plan.ts#macrosFor`): protein 2.2 g/kg, fat `fatPerKg` (1.0–1.5, default 1.2) g/kg, carbs fill the remaining calories (4/4/9 kcal per g). Keto caps carbs at 15–30 g and low-carb at 100 g, fat absorbs the rest; if protein + fat exceed the calories, carbs are 0. Above BMI 27 the grams use the weight at BMI 27. 
- **Intermittent fasting** (`FastingCard`, `useFasting`, `lib/nutrition/fasting.ts`): window saved in `settings.fasting` (minutes after local midnight; may cross midnight; 16:8/18:6/20:4/custom). The phase and countdown are derived from the window and the browser's local clock every second, so reloads and other devices agree. Switching it on the first time shows `SensitiveWarningDialog`.
- **Targets:** the plan in effect on a date (a period's plan, else the main plan; `targetsForDate` picks the training or rest day when cycling), else `DAILY_GOALS` (`resolveTargets(plan, date)` in `lib/nutrition/targets.ts`). Settings live on the account (`User.settings` JSON), saved optimistically by `useAuth().updateSettings`.

## Conventions and gotchas

- **Auth.** Passwords are hashed with argon2id (`server/auth.ts`); never store or log them. Sessions are a random 32-byte token in the httpOnly `ct_session` cookie (SameSite=Lax, `Secure` in production, no expiry = deleted when the browser closes); the DB stores only its SHA-256. The server ends a session after 30 minutes idle (sliding, renewed at most every 5 min) and 12 hours at most (`server/auth.ts`), so returning later always asks for the password. Unknown usernames cost as much time as wrong passwords. Login/register are rate-limited in memory. Because the cookie is `Secure` under `next start`, a production build must be served over https (localhost is exempt in browsers).
- **Guarding members-only actions.** `requireAuth(action)` from `useAuth()`: signed in → runs now; guest → shows the "Üyelik bulunamadı. Üye olmak ister misiniz?" panel, whose buttons go to /kayit-ol or /giris-yap with `?sonra=<current page>`; after signing in the visitor lands back on that page (the action itself is not replayed). `openAuth(view)` navigates the same way; logout and account deletion go to /giris. Used for photo/upload, the quick bar and saving a plan.
- **Local LLM limits (llama3.2, 3B).** The quick-bar matcher (`server/food/aiMatch.ts`) asks a small local model to map unrecognised fragments to food ids. It is weak at arithmetic and long Turkish text inside JSON, so the call is small, schema-constrained, capped and validated, with the rule-based parser as the fallback.
- **Meal slots.** Every meal has a `slot` (breakfast/lunch/dinner/snack). The quick bar reads it from the text ("öğlen"), otherwise `slotForHour`. The day's calories are shared between slots per meal pattern (`SLOT_SHARES`; 16:8 has no breakfast).
- **Day rating.** "On target" is ±5 % of that day's own calorie target (`rateDay`), shared by the calorie ring and the calendar dots; unlogged days are never counted as zero.
- **Barcodes.** `@zxing/browser` is lazy-loaded when the scanner opens (works on iOS too); a manual field covers no-camera cases. Only the barcode is sent to Open Food Facts; misses are cached for a day, hits for 30.
- **Grams are typed, never assumed.** "Hızlı ekle" opens a gram field when a food is tapped (the portion is only a hint); a scanned product's review starts with an empty gram field (`MealReview askGrams`). Photo breakdowns keep their estimates, and every review row has a gram field next to the slider.
- **Own foods and label reading.** "Kendi ürününü ekle" (`CustomFoodDialog`, `useCustomFoodForm`) saves a `CustomFood` (per 100 g; values may be typed per serving and are converted) and logs the grams eaten; own foods are listed first in "Hızlı ekle". A label photo goes to `POST /api/foods/label` (`server/food/label.ts`): an Ollama vision model if `LOCAL_VISION_MODEL` is set, else/then Tesseract OCR (tur+eng, two passes at 2200/3000 px; language data cached in `.cache/tesseract`) parsed by `lib/nutrition/labelParse.ts` (pure, tested). Unreadable or implausible values stay empty and are highlighted for the user; nothing is guessed.
- **Sensitive content.** Choosing 16:8 or a deficit ≥ 750 kcal in the wizard first shows `SensitiveWarningDialog`; "Bana göre değil" keeps the gentler option. Acknowledgement is stored in `settings.sensitiveWarningAck`.
- **Food database.** `lib/nutrition/foods.ts` is the single source of nutrition values (per 100 g, as eaten), aliases (lower-case Turkish; longest match wins) and unit weights. Add foods there; the photo catalog (`server/food/catalog.ts`) references them by id. Values are approximations.
- **Photo recognition (transformers.js, in-process).** `analyzeFoodImage()` first rejects non-food with `detectNoFood()` (sharp colour/texture stats; thresholds in `GUARD`, `server/food/recognize.ts`). The photo is embedded with CLIP ViT-B/16 (`Xenova/clip-vit-base-patch16`, `food/clip.ts`) and ranked by `rankFoods` (`food/foodRanking.ts`): a linear probe trained on 40 foods (`ml/models/food-probe.json`, built by `ml/build_dataset.py` + `ml/train.py`) combined with zero-shot text similarity over all foods. A best guess ≥ 0.7 is taken as one dish; otherwise SlimSAM (`Xenova/slimsam-77-uniform`, `food/segment.ts`) splits the plate on an 8×8 point grid, each region is re-embedded and named, and grams are a typical portion × the region's share (`food/plate.ts`, clamped 0.4–2×). Models download from Hugging Face into `.cache/transformers` on first use. The constitution replaces this with one hosted vision model (Principle V).
- **Photos are not in `public/`.** They go to `uploads/` and are served by `/api/uploads/[filename]` to their owner only. Filenames are server-generated UUIDs (`isValidFilename`), which also blocks path traversal.
- **Live camera needs a secure context** (https or localhost); otherwise the hidden `capture` input opens the phone's camera app. To test on a phone: `npm run dev:https` and open `https://<LAN-IP>:3000`. LAN origins are whitelisted in `allowedDevOrigins` (`next.config.ts`). Large/HEIC picks are re-encoded to a ≤1600 px JPEG client-side (`lib/photo.ts#preparePhoto`). The camera panel is inline; unmounting `CameraView` releases the stream.
- **Hydration.** Anything that depends on the browser's clock or locale (dates, the insights' hour, the calendar) renders after `useIsClient()` is true.
- **Prisma is pinned to v6.** v7+ changes client generation and config; don't bump without migrating. `DATABASE_URL` for SQLite is relative to `prisma/schema.prisma`.
- Route Handlers receive `params` as a Promise: `const { id } = await ctx.params` (typed via the global `RouteContext<"/route/[param]">`).

## Coding standards

- TypeScript strict; no `any`. Prefer `unknown` + a schema at boundaries.
- Name hooks `useX`, services `xService`, schemas `xSchema`; export types inferred from schemas.
- Keep components presentational; if a component needs `useState` for anything but trivial DOM concerns (focus, scroll), that state belongs in a hook.
- Every new API route: validate with a schema, scope by user, return `{ error }` in Turkish on failure, and add a service function for the client.
- Every new async UI action: loading state + toast/alert on both success and failure.
- Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run knip` and `npm run build` before considering a change done. CI (`.github/workflows/ci.yml`) runs the same five on every pull request and push to master.
- Delete code no shipped feature uses (constitution VI); git history is the archive.
