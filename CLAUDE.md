@AGENTS.md

# Calorie Tracker

Mobile-first web app for logging meals. Users sign up with a username + password. A meal is logged by (a) snapping/uploading a photo, which is broken down into its components with editable portions, or (b) typing free text in the quick bar ("Öğlen 200g ızgara tavuk, bol salata ve 1 dilim tam buğday ekmeği"). The dashboard shows today's calories and macros as progress rings, a smart daily summary, the meal list, a calendar history, the active nutrition plan and the FitBot coach. Plans are built in a 4-step wizard at `/plan` (FitBot/local LLM strategy + live fine-tuning). Desktop is a 3-column layout (calendar · today · profile); on phones the columns become tabs.

**Stack:** Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · Zod 4 · Prisma 6 + SQLite · `@node-rs/argon2` · Lucide icons · local Ollama for AI.

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
| `npm run db:migrate` | `prisma migrate dev`: create/apply migrations after editing `schema.prisma` |
| `npm run db:deploy` | `prisma migrate deploy`: apply existing migrations (production) |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:reset` | Drop and recreate the dev database |
| `npm run kb:ingest` | Chunk + embed `knowledge/**/*.md|txt` with Ollama (`LOCAL_EMBED_MODEL`, default `bge-m3`) into `knowledge/index.json`; rerun after changing sources |
| `npm run fitbot:eval` | Ask FitBot the cases in `scripts/fitbot-eval-cases.json` via the running dev server; prints a score (`-- --runs 3`, `-- --only tools`) and saves answers to `eval-results/` |

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
2. **State and business rules live in hooks.** One hook per concern: `useAuth`, `useNutritionPlan`, `useCalorieGoal`, `useMeals` (`useTodayMeals`, `useMealsInRange`, `useMealActions`), `useMealCapture`, `useMealReview`, `useQuickEntry`, `useDailyProgress`, `useFitBot`, the plan flow (`usePlanWizard`, `usePlanBuilder`, `usePlanTuner`), `useAuthForm` and small UI-state hooks (`useConfirm`, `useDisclosure`, `useDashboardLayout`). Context-backed hooks export a `use…Controller()` used once by the matching provider in `providers/`, plus the consumer hook.
3. **Services own HTTP.** `services/http.ts#request(url, schema, options)` is the only `fetch` wrapper in the browser: it maps network errors, `{ error }` responses and malformed payloads to `ApiError` (Turkish message, HTTP status) and validates every success payload against a Zod schema. Domain services (`authService`, `mealService`, `fitbotService`) are thin wrappers around it.
4. **Route Handlers are thin.** Parse + validate input (`server/http.ts`: `readJson`, `validate`), check the session (`getCurrentUser`), call a `server/` function, map the result to a response. No SQL, no business logic in `app/api`. Error bodies are always `{ error: string }` (`types/api.ts`).
5. **All untrusted data passes a schema.** Request bodies, query strings, stored JSON (`User.settings`), AI model output (vision, quick-bar matcher, FitBot) and API responses on the client are parsed with the Zod schemas in `types/`. Import `z` from `@/types/zod` (sets Turkish error messages), never directly from `"zod"` in schema files. Types are inferred from schemas (`z.infer`) so the two can't drift.
6. **Math is pure and single-sourced.** BMR/TDEE/targets (`lib/nutrition/energy.ts`), plan math (`lib/nutrition/plan.ts`: Harris-Benedict, activity, macros per diet style, calorie cycling; `planTuning.ts`: slider rebalancing), macro sums and portion scaling (`lib/nutrition/macros.ts`: `itemMacros`, `totalOfItems`), the food database (`lib/nutrition/foods.ts`), the quick-bar parser (`lib/nutrition/quickParse.ts`) and daily insights (`lib/nutrition/insights.ts`) are plain functions used by both client and server. The server always recomputes meal totals from items; never trust client totals.
7. **Graceful degradation.** Every dashboard section is wrapped in `<ErrorBoundary>` (one crash shows a "Tekrar dene" card, the rest keeps working). Every async action shows a loading state (skeleton, spinner or disabled button) and ends in feedback: `useToast()` for results (success/error/celebrate), inline `alert-*` for form errors. AI features degrade silently: no Ollama → the quick bar still works with the rule-based parser, FitBot shows a clear error.
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
    panel/page.tsx         <Dashboard /> + <FitBot />; guests may look around (old /uygulama redirects here)
    plan/page.tsx          Plan wizard (`?duzenle=1` opens the active plan in the tuning desk)
    gelisim/page.tsx       "Gelişim & Analiz": streaks, calories vs goal (7/30/90 days), macro averages (old /trendler redirects here)
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
      plans/generate/route.ts                    POST PlanInputs -> { plan, notice } draft (AI or Harris-Benedict fallback)
      uploads/[filename]/route.ts                GET photo (owner only)
      fitbot/chat/route.ts                       POST chat -> { reply, sources }
  components/
    Dashboard.tsx          Composition root: calls hooks, passes props down
    ErrorBoundary.tsx      Section-level error boundary
    dashboard/             Panel cards (Lokma layout): DashboardIntro, EnergyCard (ring), MealsCard (by slot, item delete + undo), QuickAddCard, WeekCard
    ui/                    Dumb primitives: DashCard, LogoMark (animated brand ring), PortionControl, RangeSlider, Switch, ChoiceCard, CategoryChip, Toaster,
                           Dialog, ConfirmDialog, Segmented, EmptyState, MacroBar, MealThumb, Avatar, FitBotAvatar, CustomPlanBadge, ErrorFallback
    layout/SiteHeader.tsx  Nav: animated brand, section pills (members), login/register or avatar + profile menu
    auth/                  GuardDialog ("Üyelik bulunamadı…"), AuthScreen (sign-in/up page + form), DeleteAccountDialog
    meals/                 MealCapture (photo flow), CameraView, MealReview (breakdown + sliders), QuickEntryBar, QuickPicks, MealEditDialog
    progress/              DailyInsights, WaterCard (glasses), MicroPanel
    history/               MealCalendar, DayDetail
    plan/                  PlanBuilder (/plan container), WizardProgress, StepBody/Training/Diet/Advanced, LivePreview,
                           GeneratingScreen, PlanReview (tuning desk), MacroSliderRow
    profile/ActivePlanCard Dashboard card for the active plan (or the CTA to create one)
    fitbot/FitBot.tsx      Floating chat widget
    landing/               Landing: IntroHero, LegendStories (useStoryPlayer), HowItWorks, FinalCall, MaskedWords; legends.ts (sourced athlete anecdotes)
  hooks/                   State + business flows (see rule 2)
  providers/               AppProviders -> ToastProvider -> AuthProvider (renders GuardDialog)
  services/                http.ts (request, ApiError), authService, mealService, fitbotService
  server/
    db.ts, auth.ts         Prisma client · argon2id hashing, sessions, getCurrentUser
    accounts.ts            registerUser, authenticate, settings
    http.ts                apiError, unauthorized, readJson, validate
    rateLimit.ts, storage.ts
    meals/repository.ts    All meal/meal-item/saved-meal queries (user-scoped), DTO mapping
    tracking/repository.ts Weight and water queries (user-scoped)
    vision.ts              analyzeFoodImage (mock) -> MealDraft, validated with mealDraftSchema
    food/                  catalog.ts (dishes, plate colours), recognize.ts (not-food guard, plate breakdown),
                           imageFeatures.ts (sharp stats), aiMatch.ts (LLM fallback for the quick bar), quickEntry.ts
    llm/                   config.ts (Ollama URL / model / context size), ollama.ts (ollamaChat, parseJsonAnswer)
    plans/                 generate.ts (formula baseline -> AI -> fallback), aiStrategy.ts (LLM numbers + summary, quality gate)
    fitbot/                chat.ts (orchestration, tools loop), context.ts, tools.ts, knowledge.ts (RAG), prompt.ts
  lib/
    nutrition/             energy, macros, targets, customPlan (legacy), plan, planTuning, foods (food DB + micros), quickParse, insights,
                           slots (meal slots, per-slot kcal shares), dayRating, micros, water, weight (trend, rate), trends (series, streaks)
    csv.ts                 CSV writer for the export
    labels.ts              Turkish UI labels
    dates.ts, photo.ts     Date helpers · browser-only photo helpers (resize, frame capture)
  types/                   zod.ts, nutrition.ts, meal.ts, plan.ts, profile.ts, settings.ts, auth.ts, fitbot.ts, api.ts
```

## How the main flows work

- **Photo → breakdown.** `useMealCapture` (camera or file) → `mealService.analyze` → `POST /api/meals/analyze` → `analyzeFoodImage` returns `{ name, items[] }` where each item has a category (protein/carb/fat…), grams and nutrition per 100 g. `MealReview` shows one card per item with a portion slider and ½×/1×/1½×/2× presets (`useMealReview`); totals update live via `totalOfItems`. Saving posts the photo + reviewed items; the server recomputes totals and stores items in `MealItem`.
- **Quick bar.** `useQuickEntry` runs `quickParse` (pure, `lib/nutrition/quickParse.ts`) on every keystroke for an instant preview. The parser splits on commas/"ve"/"ile", reads quantities ("200g", "1 dilim", "iki yemek kaşığı", "yarım porsiyon"), size words ("bol", "az") and meal-slot words ("öğlen" → "Öğle yemeği"), and matches foods by alias with Turkish suffix tolerance ("ekmeği" → "ekmek"). Unrecognised fragments are sent (debounced) to `POST /api/meals/parse`, where `aiMatch.ts` asks the local LLM to map them to food ids, constrained by a JSON schema and validated again. Enter logs the meal without a photo.
- **Progress.** `useDailyProgress` turns today's meals + targets into ring data (calories: goal met within ±5 %, red above +5 %; protein: minimum; carbs/fat: limits) and insights (`buildInsights`: e.g. "Bugün hedefine göre 25 g protein açığın var" + a concrete food suggestion that fits the remaining calories). When a goal is reached during the session, the ring pops, a check badge appears and a toast celebrates (not on page load).
- **Meal lists refresh** through a shared version counter in `useMeals` (`invalidateMeals()` after any mutation), so the today list and the calendar month refetch without prop drilling.
- **Plan wizard (`/plan`).** `usePlanWizard` holds the 4 steps (body + goal with deficit/surplus slider, training school + weekdays, diet style + meal pattern/16:8 window, calorie-cycling switch) and a live Harris-Benedict preview. "AI planını oluştur" (guarded) -> `usePlanBuilder` shows the stepped loading screen and calls `POST /api/plans/generate`. The server always computes the formula plan (`formulaPlan`), then `generateAiPlan` asks the local LLM in two calls: numbers as schema-constrained JSON (clamped to ±5 % of the formula so the user's deficit isn't undone, macros re-balanced to add up) and the coach summary as plain text with a hard token cap. The summary must pass a quality gate (`cleanSummary`: Turkish only, no garbled/English words, nothing contradicting the goal) or the formula summary is used. LLM down/invalid -> formula plan + notice "AI koç servisine erişilemedi…"; server unreachable -> the same fallback is built client-side. The draft opens in `PlanReview` (`usePlanTuner`): calorie slider, macro sliders with g/kg, "Kalori sabit" lock (moving one macro rebalances the others, `withMacro`), training/rest tabs when cycling. "Bu planı aktif planım yap" saves it to `User.settings.nutritionPlan` and returns to the dashboard.
- **First-time setup (`/baslangic`).** New accounts have `User.onboardingCompleted = false` (accounts that existed before the migration were set to true). `requireOnboarded()` (`server/guards.ts`) in the /panel, /plan and /gelisim pages redirects them to /baslangic until `POST /api/me/onboarding` saves the answers; the server maps them to PlanInputs (`lib/nutrition/onboarding.ts`: goal from current vs goal weight, activity level -> training routine) and stores a formula plan as the active plan.
- **Macro engine** (`lib/nutrition/plan.ts#macrosFor`): protein 2.2 g/kg, fat `fatPerKg` (1.0–1.5, default 1.2) g/kg, carbs fill the remaining calories (4/4/9 kcal per g). Keto caps carbs at 15–30 g and low-carb at 100 g, fat absorbs the rest; if protein + fat exceed the calories, carbs are 0. Above BMI 27 the grams use the weight at BMI 27. The AI plan only adjusts calories (±5 %); its macros are always re-derived by the engine.
- **Intermittent fasting** (`FastingCard`, `useFasting`, `lib/nutrition/fasting.ts`): window saved in `settings.fasting` (minutes after local midnight; may cross midnight; 16:8/18:6/20:4/custom). The phase and countdown are derived from the window and the browser's local clock every second, so reloads and other devices agree. Switching it on the first time shows `SensitiveWarningDialog`.
- **Targets:** wizard plan (`targetsForDate`: training or rest day by weekday when cycling) > legacy custom plan > legacy profile > `DAILY_GOALS` (`resolveTargets`). Settings live on the account (`User.settings` JSON), saved optimistically by `useAuth().updateSettings`. The old calculator/custom-plan UI was replaced by the wizard; legacy data is still read so existing users keep their targets until they create a plan. FitBot receives the plan in its existing shape (`planForFitbot`: a Profile + today's targets as a custom plan), so its prompt and eval are unchanged.

## Conventions and gotchas

- **Auth.** Passwords are hashed with argon2id (`server/auth.ts`); never store or log them. Sessions are a random 32-byte token in the httpOnly `ct_session` cookie (SameSite=Lax, `Secure` in production, no expiry = deleted when the browser closes); the DB stores only its SHA-256. The server ends a session after 30 minutes idle (sliding, renewed at most every 5 min) and 12 hours at most (`server/auth.ts`), so returning later always asks for the password. Unknown usernames cost as much time as wrong passwords. Login/register are rate-limited in memory. Because the cookie is `Secure` under `next start`, a production build must be served over https (localhost is exempt in browsers).
- **Guarding members-only actions.** `requireAuth(action)` from `useAuth()`: signed in → runs now; guest → shows the "Üyelik bulunamadı. Üye olmak ister misiniz?" panel, whose buttons go to /kayit-ol or /giris-yap with `?sonra=<current page>`; after signing in the visitor lands back on that page (the action itself is not replayed). `openAuth(view)` navigates the same way; logout and account deletion go to /giris. Used for photo/upload, the quick bar, saving a plan, activating a custom plan and revealing calculator results.
- **Local LLM limits (llama3.2, 3B).** It's weak at arithmetic and at long Turkish text inside JSON (rambles, breaks escapes), so every LLM feature here is: small calls, schema-constrained output, hard `num_predict` caps, server-side validation/clamping, and a deterministic fallback. Its Turkish summaries often fail the quality gate; a larger model via `LOCAL_LLM_MODEL` (e.g. a 7-8B model) should pass more often.
- **Two sets of labels on purpose.** `ACTIVITY_LEVELS`/`PACE_LEVELS`/`TRAINING_TYPES`/`BMI_CATEGORIES` in `lib/nutrition/energy.ts` keep English `label`s because they feed FitBot's prompt and tool results (the eval set is calibrated on them); the UI renders the Turkish ones from `lib/labels.ts`. FitBot replies in the user's language.
- **Meal slots.** Every meal has a `slot` (breakfast/lunch/dinner/snack). The quick bar reads it from the text ("öğlen"), otherwise `slotForHour`. The day's calories are shared between slots per meal pattern (`SLOT_SHARES`; 16:8 has no breakfast).
- **Day rating.** "On target" is ±5 % of that day's own calorie target (`rateDay`), shared by the calorie ring and the calendar dots; unlogged days are never counted as zero.
- **Barcodes.** `@zxing/browser` is lazy-loaded when the scanner opens (works on iOS too); a manual field covers no-camera cases. Only the barcode is sent to Open Food Facts; misses are cached for a day, hits for 30.
- **Grams are typed, never assumed.** "Hızlı ekle" opens a gram field when a food is tapped (the portion is only a hint); a scanned product's review starts with an empty gram field (`MealReview askGrams`). Photo breakdowns keep their estimates, and every review row has a gram field next to the slider.
- **Own foods and label reading.** "Kendi ürününü ekle" (`CustomFoodDialog`, `useCustomFoodForm`) saves a `CustomFood` (per 100 g; values may be typed per serving and are converted) and logs the grams eaten; own foods are listed first in "Hızlı ekle". A label photo goes to `POST /api/foods/label` (`server/food/label.ts`): an Ollama vision model if `LOCAL_VISION_MODEL` is set, else/then Tesseract OCR (tur+eng, two passes at 2200/3000 px; language data cached in `.cache/tesseract`) parsed by `lib/nutrition/labelParse.ts` (pure, tested). Unreadable or implausible values stay empty and are highlighted for the user; nothing is guessed.
- **Sensitive content.** Choosing 16:8 or a deficit ≥ 750 kcal in the wizard first shows `SensitiveWarningDialog`; "Bana göre değil" keeps the gentler option. Acknowledgement is stored in `settings.sensitiveWarningAck`.
- **Food database.** `lib/nutrition/foods.ts` is the single source of nutrition values (per 100 g, as eaten), aliases (lower-case Turkish; longest match wins) and unit weights. Add foods there; the photo catalog (`server/food/catalog.ts`) references them by id. Values are approximations.
- **Vision AI is a mock, driven by image statistics.** `analyzeFoodImage()` decodes the photo with `sharp`, rejects non-food via `detectNoFood()` (too dark, flat, a face/person, mostly blue, no colour), else matches the frame's colours to a dish in `server/food/catalog.ts` and estimates each component's grams from frame coverage plus per-image jitter. Same photo → same result; 800 ms simulated latency. Thresholds live in `GUARD` in `server/food/recognize.ts`. To use a real model, replace `mockAnalyze` and keep returning `{ name, items }` (it's validated with `mealDraftSchema`) and throwing `NoFoodError` for non-food.
- **Photos are not in `public/`.** They go to `uploads/` and are served by `/api/uploads/[filename]` to their owner only. Filenames are server-generated UUIDs (`isValidFilename`), which also blocks path traversal.
- **Live camera needs a secure context** (https or localhost); otherwise the hidden `capture` input opens the phone's camera app. To test on a phone: `npm run dev:https` and open `https://<LAN-IP>:3000`. LAN origins are whitelisted in `allowedDevOrigins` (`next.config.ts`). Large/HEIC picks are re-encoded to a ≤1600 px JPEG client-side (`lib/photo.ts#preparePhoto`). The camera panel is inline; unmounting `CameraView` releases the stream.
- **Hydration.** Anything that depends on the browser's clock or locale (dates, the insights' hour, the calendar) renders after `useIsClient()` is true.
- **FitBot needs a local Ollama server.** `server/fitbot/chat.ts` calls `${LOCAL_LLM_URL}/api/chat` (default `http://localhost:11434`, model `LOCAL_LLM_MODEL` default `llama3.2`, `LOCAL_LLM_NUM_CTX` default 8192), non-streaming, 120 s timeout, last 20 messages, and throws `FitbotError` (503 down, 502 model error, 504 timeout) which the route maps to `{ error }`. The persona is `FITBOT_SYSTEM_PROMPT` (`server/fitbot/prompt.ts`).
- **FitBot sees the user's data.** The widget sends profile, custom plan, local-day bounds and timezone as `context`; `context.ts` re-validates them with the profile schemas, reads the signed-in user's meals (guests: empty log) and appends `buildUserContext()`. All numbers are precomputed there on purpose: small models get arithmetic wrong.
- **FitBot tools and RAG.** Calculator tools (`tools.ts`) run in a loop (max 3 rounds; last round without tools). Knowledge-base excerpts (`knowledge.ts`, cosine ≥ 0.55, within 0.1 of the best, top 4) are inserted right before the latest user message. Embeddings run on the CPU unless `LOCAL_EMBED_GPU=1`. Measure changes with `npm run fitbot:eval` (`--runs 2`+): llama3.2 scored 42/44 with the starter knowledge base.
- **Prisma is pinned to v6.** v7+ changes client generation and config; don't bump without migrating. `DATABASE_URL` for SQLite is relative to `prisma/schema.prisma`.
- Route Handlers receive `params` as a Promise: `const { id } = await ctx.params` (typed via the global `RouteContext<"/route/[param]">`).

## Coding standards

- TypeScript strict; no `any`. Prefer `unknown` + a schema at boundaries.
- Name hooks `useX`, services `xService`, schemas `xSchema`; export types inferred from schemas.
- Keep components presentational; if a component needs `useState` for anything but trivial DOM concerns (focus, scroll), that state belongs in a hook.
- Every new API route: validate with a schema, scope by user, return `{ error }` in Turkish on failure, and add a service function for the client.
- Every new async UI action: loading state + toast/alert on both success and failure.
- Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` before considering a change done. CI (`.github/workflows/ci.yml`) runs the same four on every pull request and push to master.
