@AGENTS.md

# Calorie Tracker (Kalori Takip)

A Turkish calorie and macro tracker for iOS and Android. Users sign up (e-mail; Google; Apple on
iOS), answer a short setup that builds a personal plan, log meals by searching a food and typing the
grams, tune or rebuild their plan in a wizard, and look back at past days in a calendar. There is no
web front end.

**Stack:** Expo SDK 57 (expo-router, typed routes, TypeScript strict) · Supabase (Postgres with RLS,
Auth) · TanStack Query · Zod 4 · react-native-svg · node:test + fast-check · pgTAP · Maestro.

## Rules and plan

- **Constitution wins:** `.specify/memory/constitution.md` (v2.0.1) over this file.
- **Roadmap:** `specs/ROADMAP.md`: 001 mobile foundation → 002 food database + barcode → 003 AI
  logging → 004 tracking → 005 account and stores → 006 subscription (RevenueCat).
- **Current feature:** `specs/003-ai-logging/` (branch `003-ai-logging`): spec, plan and tasks done;
  implementation under way (tasks.md); photo and text logging through one `ai-log` Edge Function
  (Gemini, food ids as a schema enum), a daily allowance of 5 in `ai_requests`, an on-device text
  preview in `@calorie/core`, and `tools/aieval` on the owner's 30 weighed meals. 002 part A is
  done; in 001, T060 is open. Authority inside a feature: spec/plan/research/data-model and
  `contracts/` > `tasks.md` > this file.
- **AI (003):** one hosted vision model behind one Edge Function; the owner chose **Gemini**. No
  on-device or in-process models, no Ollama.
- **Workout (007):** `specs/007-workout/`: one program per user (`workout_programs`, days as jsonb) and logged workouts (`workout_sessions`); the Antrenman tab, a program editor with ready-made splits, the workout logger and per-exercise weight progress (`hooks/workoutLogic.ts`). Separate from the plan wizard's training style, which only shapes calories.
- **Out of scope:** FitBot, the AI plan strategy, any website.
- **Workflow:** Spec Kit skills in `.claude/skills/` (`/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`); small pull requests, one phase or story each.

## Progress

001 Phases 1–8 are implemented (accounts, setup, meal logging, plan wizard, history, polish);
only T060, the device validation on an Android emulator and an iPhone, is open. On a phone through Expo Go the owner checked sign-up, setup, meal logging
and the plan wizard's sliders; Google/Apple sign-in and the full quickstart validation on a
development build are still open (`specs/001-mobile-foundation/checklists/validation.md`).

## Layout

```text
apps/mobile          Expo app (src/app routes, components, hooks, providers, services, theme.ts)
packages/core        @calorie/core: pure nutrition logic + Zod schemas + generated DB types
supabase             migrations, pgTAP tests (supabase/README.md)
tools/preview        screen gallery on react-native-web with fake services (never shipped)
tools/fooddata       food list pipeline: sources + USDA extract → list migration, foods.txt/json, review.html (never shipped)
tools/aieval         AI logging evaluation: phrase set, owner's weighed photos, model reports (never shipped)
supabase/functions   Edge Functions (Deno); _shared/ai is the only code that calls the AI vendor
specs                Spec Kit features; tofuhq-design = design system skill
```

## App architecture

- **Layers** (ESLint `no-restricted-imports`): routes (`src/app`) → `components` → `hooks` /
  `providers` → `services` → `@calorie/core`. `components/ui` imports neither hooks nor services.
  Only `services/` imports `@supabase/supabase-js`; services validate every row with the core
  schemas (`@calorie/core/schemas/rows`) and map errors to Turkish text (`services/errorMessages.ts`).
- **Pure logic next to hooks:** rules a hook needs live in a sibling `*Logic.ts` / helper file with no
  React Native imports, tested under node from `apps/mobile/tests` (e.g. `mealLogic.ts`,
  `planWizardLogic.ts`, `historyLogic.ts`, `components/ui/sliderGesture.ts`).
- **Routing:** the root layout alone decides access with `Stack.Protected` (no session → welcome,
  where sign-up shows the verify state until the link is opened; recovery → reset-password; setup
  incomplete → `setup/[step]`; else tabs); every signed-in route
  is registered inside the `ready` guard. Deep links use `kaloritakip://`.
- **Server data:** TanStack Query keys start with the concern and the user id (`["meals", userId,
  …]`, `["activePlan", …]`, `["plans", …]`, `["profile", …]`); a write invalidates its prefix.
- **Core** (`packages/core`): ESM with relative `.ts` imports, no react / react-native / supabase.
  Plan engine (`buildPlan`, `tunedPlan`, the calorie floor), targets, day rating (±5 %), dates
  (Monday-first), Turkish labels, `normalizeTr` + `searchStems` for search.

## Database (Supabase)

- **Server-owned numbers** (constitution III): the app sends foods and grams, never nutrition
  values or totals; triggers copy per-100 g values and recompute totals; `log_meal`,
  `complete_onboarding` and `save_plan` are `security definer` RPCs (bodies in the `private` schema,
  `set search_path = ''`, `auth.uid()` checks) with an explicit `grant execute … to authenticated`.
- **RLS on every table**; no function is callable through the API unless it is an intended RPC.
- **Dev project:** `kalori-takip-dev`, ref `hhymtqbugbeiqszcpyai` (eu-central-1).
- **Migrations:** write `supabase/migrations/<version>_<name>.sql`, apply the identical SQL (MCP
  `apply_migration` or `npx supabase db push`), keep the recorded version equal to the file name;
  never edit an applied migration. Then regenerate `packages/core/src/db/database.types.ts` and check
  the security advisor. Details: `supabase/README.md`.
- **Tests:** pgTAP files in `supabase/tests/database/*.test.sql`, each one transaction that rolls
  back; written before the migration they cover and seen failing first.

## Commands (repo root)

```bash
npm install                 # all workspaces
npm run mobile              # Metro (Expo Go or a development build)
npm test                    # core (node:test + fast-check) and the app's pure helpers
npm run typecheck && npm run lint && npm run knip
npm run preview             # builds tools/preview/dist/artifact.html
cd apps/mobile && npx expo export --platform android --output-dir <tmp>   # proves the bundle builds
npm run fetch -w fooddata   # once per pinned USDA release: refreshes sources/usda/extract.json (network)
npm run build -w fooddata   # food rules, out/foods.txt, dist/review.html, search_cases.test.sql
npm run build -w fooddata -- --release <YYYYMMDDHHMMSS>   # also writes the next *_food_list_<n>.sql
npm run check -w fooddata   # CI: committed list outputs match their sources
npm run eval:text -w aieval # CI: the text preview on the phrase set (≥ 90 %)
npm run test:functions -w @calorie/db   # Edge Function lint, check and Deno tests (needs Deno)
GEMINI_API_KEY=… npm run eval -w aieval -- --model <id>   # model report in tools/aieval/out
```

**Food list** (spec 002): edit `tools/fooddata/sources/` (USDA foods by category with FDC ids,
`labels.ts`, recipes, `search-cases.ts`), never the generated `*_food_list_*.sql`, `foods.txt` or
`search_cases.test.sql`. Recipes follow the FNDDS formulation of the closest dish (research §11).
Saved meals keep their values: items snapshot per-100 g values on insert. A new portion unit must
also go into `packages/core/src/text/units.ts` (the text preview reads units from there; the build
fails otherwise).

**AI logging** (spec 003): the app never calls the vendor; `services/aiService.ts` calls the
`ai-log` function, which returns food ids and grams only (values per 100 g always come from
`foods`). Every AI path fills the meal draft and ends on the review step; estimated grams are
marked and unmatched things are never saved. The text preview (`@calorie/core/text/parseMeal` +
`hooks/textPreviewLogic.ts`) needs no model and no allowance.

Expo specifics for agents: `apps/mobile/AGENTS.md` (versioned SDK 57 docs, `npx expo install`).
Typed routes come from `.expo/types/router.d.ts`, which a short `npx expo start` regenerates after a
new route.

## Screen previews

The owner has no emulator. `npm run preview` renders the app's real screens with react-native-web
and the fakes in `tools/preview/src/fakes` (swapped in by `metro.config.js`). Add every new screen to
`tools/preview/src/PreviewGallery.tsx`; the generated `artifact.html` is published as a claude.ai
artifact when a phase adds screens.

## Conventions

- **Language:** user-facing text is Turkish with informal "sen" (`LOCALE = "tr-TR"`); code,
  comments and docs are English.
- **Design:** tofuhq (`tofuhq-design/SKILL.md`): ink header band, white rounded panel, 1 px dark
  card outlines, lime for the one primary action per screen, blue only for links and focus. Colours,
  spacing (4 px grid), radii and type only from `apps/mobile/src/theme.ts`.
- **Typeface:** Bricolage Grotesque Bold for headings and big numbers (owner's choice, 2026-10-09),
  loaded through `fontAssets`; body text uses the system font.
- **Accessibility:** touch targets ≥ 44 pt, labels on icon-only buttons, body text ≥ 4.5:1 contrast.
- **No dead code** (constitution VI): `npm run knip` reports nothing; add a dependency only in the
  change that first imports it.
- **Placeholders:** bundle ID / package `com.kaloritakip.app` until the owner decides.
