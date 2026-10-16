---

description: "Task list for 003 AI Logging"
---

# Tasks: AI Logging

**Input**: Design documents from `/specs/003-ai-logging/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The constitution (IX) requires them: pgTAP files are written before the
migration and seen failing first; the Edge Function gets Deno tests with a fake model; core and app
logic get node tests written before the code.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story from spec.md (US1 photo, US2 text, US3 allowance and fallback)
- Paths: `supabase/`, `packages/core/`, `apps/mobile/`, `tools/aieval/` per plan.md

## Owner inputs needed during this feature

- Before T013: a Gemini API key for development (free tier is fine), set as the `GEMINI_API_KEY`
  secret on the dev project in the Supabase dashboard (the owner enters it; it never goes into chat
  or the repository).
- Before T037: 30 home meals, each food weighed on a kitchen scale, photographed from above at the
  table (spread over 2–3 weeks); the grams per food go into a shared note or straight into
  `tools/aieval/cases/photos.json`.
- Before the TestFlight build (005): the paid-tier key replaces the development key.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New packages, the function and evaluation workspaces, shared schemas.

- [x] T001 Install `expo-image-picker` and `expo-image-manipulator` with `npx expo install` in `apps/mobile`; add the image-picker config plugin to `apps/mobile/app.config.ts` with Turkish camera and photo-library permission texts ("Yemeğinin fotoğrafını çekmek için kameraya erişim gerekiyor", "Galeriden yemek fotoğrafı seçmek için fotoğraflarına erişim gerekiyor")
- [x] T002 [P] Create the Edge Function layout: `supabase/functions/ai-log/`, `supabase/functions/_shared/ai/`, `supabase/functions/deno.json` (imports `npm:zod@4`, `npm:@supabase/supabase-js@2`, `jsr:@std/assert`), `[functions.ai-log] verify_jwt = true` in `supabase/config.toml`; script `test:functions` = `deno test --allow-env supabase/functions` in `supabase/package.json`; CI job step with `denoland/setup-deno` running it in `.github/workflows/ci.yml`; knip: ignore `supabase/functions/**` (Deno, outside npm)
- [x] T003 [P] Create the workspace `tools/aieval/` (`package.json` name `aieval`, private, `"type": "module"`, scripts `eval` = `tsx src/eval.ts`, `eval:text` = `tsx src/evalText.ts`, `test`, `typecheck`; dependency `@calorie/core`; strict `tsconfig.json`; `cases/photos/` with a `.gitkeep`); add it to `knip.json`
- [x] T004 [P] Zod schemas in `packages/core/src/schemas/ai.ts` per contracts/ai-log.md: `aiLogRequestSchema` (photo | text, 1–300 chars), `aiLogResponseSchema` (items 1–30, grams 0 < g ≤ 5000, `estimated`, `unmatched`, `allowance`), `aiErrorSchema` (the seven codes, optional `resets_at`), `allowanceRowSchema`; export via the core package map; tests in `packages/core/tests/aiSchemas.test.ts`

**Checkpoint**: `npm test`, `npm run typecheck`, `npm run knip` pass; `deno test` runs (no tests yet).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The allowance table, the AI boundary and the draft changes every story needs.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

### Tests

- [x] T005 [P] pgTAP `supabase/tests/database/ai_requests.test.sql` (fail first) per data-model.md: RLS on, a user sees only their rows, `authenticated` cannot insert/update/delete; `ai_claim` inserts `pending`, refuses at 5 (`pending` + `counted`) with the next local midnight, returns the existing row (and its `result`) for a repeated key, ignores `pending` rows older than 2 minutes; `ai_finish` sets a status once, `counted` needs ≥ 1 item; `local_date` follows `profiles.time_zone` (a user in `Pacific/Auckland` and one in `Europe/Istanbul` get different dates at the same instant); `ai_allowance()` returns used/limit/resets_at for the caller and is not callable by `anon`; `ai_claim`/`ai_finish` not executable by `authenticated`
- [x] T006 [P] Deno tests `supabase/functions/_shared/ai/validate.test.ts` (fail first): unknown or non-searchable ids go to `unmatched`; grams ≤ 0 dropped; grams > 5000 capped and flagged; duplicate ids summed; more than 30 items cut to 30; invalid JSON → `ai_unavailable`; empty result → `no_food`; prompt builder lists every searchable food as `id · ad · porsiyon g` and the schema enum equals that id set
- [x] T007 [P] Deno tests `supabase/functions/ai-log/index.test.ts` (fail first) with a fake model and a fake database: 401 without a session; 400 for a bad body or text over 300 characters; 413 over 1.5 MB or 1600 px; 422 `bad_image`; 429 with `resets_at` when `ai_claim` refuses; a repeated key returns the stored body without a model call; model error, timeout (fake clock, 20 s) and `no_food` call `ai_finish` with `released`; success calls it with `counted` and returns contracts/ai-log.md's body
- [x] T008 [P] App logic tests `apps/mobile/tests/mealLogic.test.ts` (fail first): `fillDraftFromAi(draft, response, foods)` adds items with grams and `estimated`, keeps existing items, respects `MAX_DRAFT_ITEMS`, puts `unmatched` into the draft; typing grams or picking a portion clears `estimated`; `resolveUnmatched(draft, key, food)` replaces the entry with an item; `dismissUnmatched` removes it; `buildLogMealPayload` never includes unmatched entries

### Implementation

- [x] T009 Migration `supabase/migrations/<v>_ai_requests.sql` per data-model.md: table, index, RLS and select-own policy, `private.ai_daily_limit()`, `private.ai_claim`, `private.ai_finish` (`security definer`, `set search_path = ''`, row lock with `for update` on the user's rows for the date), `public.ai_allowance()` with `grant execute … to authenticated`; revoke everything else from `anon`/`authenticated`
- [x] T010 Apply T009 to the dev project (MCP `apply_migration`, version fixed to the file name), regenerate `packages/core/src/db/database.types.ts`, make T005 pass on dev, run the security advisor
- [x] T011 `supabase/functions/_shared/ai/` (plain TypeScript, no Deno globals, so `tools/aieval` can import it): `foods.ts` (load searchable foods: id, name, typical portion), `prompt.ts` (Turkish instructions: one plate or one description, ids only from the list, grams per food, `estimated` false only for stated amounts, unseen things as `unmatched`), `schema.ts` (response schema with the id enum), `gemini.ts` (`generateContent` with `responseMimeType`/`responseSchema`, inline JPEG, 20 s abort, token counts, one retry on 5xx), `validate.ts`; make T006 pass
- [x] T012 `supabase/functions/ai-log/index.ts`: verify the JWT user, check size and body with the core-equivalent schema, decode the JPEG header for dimensions, `ai_claim` → model → validate → `ai_finish`, cache the food list per cold start, return the contract body with the fresh allowance; make T007 pass
- [ ] T013 Deploy `ai-log` to the dev project; set `GEMINI_MODEL=gemini-3.5-flash-lite` (owner sets `GEMINI_API_KEY`); smoke-test one text request with a test user through `curl` and check the `ai_requests` row
- [x] T014 [P] `apps/mobile/src/services/aiService.ts` (the only caller of `ai-log` and `ai_allowance`; new `request_key` per attempt via `expo-crypto`, the same key for a retry; responses parsed with the T004 schemas; 25 s timeout) and the seven error codes in `apps/mobile/src/services/errorMessages.ts`
- [x] T015 `apps/mobile/src/hooks/mealLogic.ts` and `useMealDraft.ts`: `estimated`, `unmatched`, `fillDraftFromAi`, `resolveUnmatched`, `dismissUnmatched`; make T008 pass
- [x] T016 Review step per contracts/screens.md: "tahmini" next to estimated grams in `apps/mobile/src/components/meals/DraftItemCard.tsx`; an "Eşleşmeyenler" section with "Ara" (opens `log/search` prefilled; the picked food resolves the entry) and dismiss in `MealReviewScreen.tsx`; `FoodSearchScreen.tsx` accepts a prefill and a "resolve" mode
- [x] T017 [P] Preview fakes: `tools/preview/src/fakes/aiService.ts` (a fixed analysis with one unmatched item) swapped in by `metro.config.js`; gallery entry "Kontrol et (AI)" in `tools/preview/src/PreviewGallery.tsx`

**Checkpoint**: the function answers on dev; a fake AI result fills the review step with "tahmini" and "Eşleşmeyenler" in the gallery.

---

## Phase 3: User Story 1 - Log a meal from a photo (Priority: P1) 🎯 MVP

**Goal**: Photograph a plate and land on the review step with our foods and estimated grams.

**Independent Test**: Photograph a weighed plate, correct one weight, save; items are our foods
with the confirmed grams and totals equal a search-logged meal (spec US1, SC-008).

### Tests

- [x] T018 [P] [US1] `apps/mobile/tests/photoLogic.test.ts` (fail first): `resizeTarget(width, height)` keeps the aspect and puts the long edge at 1024 (never upscales); the photo flow state machine (`idle → picked → analysing → done | failed`) ignores a late answer after cancel and never fills the draft twice for one key

### Implementation

- [x] T019 [US1] `apps/mobile/src/hooks/photoLogic.ts` (pure: resize target, state machine) and `useAiLog.ts` (pick/take via `expo-image-picker`, shrink with `expo-image-manipulator` to JPEG 0.7, call `aiService`, load the returned foods through `foodService`, `fillDraftFromAi`, map error codes); make T018 pass
- [x] T020 [US1] `apps/mobile/src/components/ai/PhotoCapture.tsx` and the modal route `apps/mobile/src/app/log/photo.tsx` per contracts/screens.md (choice, preview, analysing with cancel, `no_food` and `ai_unavailable` states with their next steps, permission refusal line); register the route in `apps/mobile/src/app/_layout.tsx` inside the `ready` guard
- [x] T021 [US1] "Fotoğrafla" button above the field in `apps/mobile/src/components/meals/FoodSearchScreen.tsx` (T030 adds "Yazarak" beside it)
- [x] T022 [P] [US1] Gallery entries "Fotoğrafla: analiz", "Fotoğrafla: yemek yok" in `tools/preview/src/PreviewGallery.tsx`
- [ ] T023 [US1] On the phone (Expo Go, dev project): quickstart §3 steps 1–2; record in `specs/003-ai-logging/checklists/validation.md`

**Checkpoint**: photo logging works end to end on dev.

---

## Phase 4: User Story 2 - Log a meal by typing (Priority: P1)

**Goal**: Type a Turkish description, see an instant preview, save from it or send it to the AI.

**Independent Test**: The committed phrase set scores ≥ 90 % on the preview alone (SC-003); on the
phone "2 yumurta ve yarım simit" previews Yumurta 100 g and Simit 60 g and saves without using the
allowance.

### Tests

- [x] T024 [P] [US2] `packages/core/tests/parseMeal.test.ts` (fail first): splitting on "," "ve" "ile" "+" and new lines; digits with decimal comma; number words "bir"… "dokuz yüz", "yüz elli", "iki yüz"; "yarım", "buçuk" ("bir buçuk dilim"), "çeyrek"; gram words "g", "gr", "gram"; unit words from the portion list incl. two-word units ("su bardağı", "yemek kaşığı"); suffixed units ("dilimi", "kaşık"); negation words (-sız/-siz/-suz/-süz) kept in `negated` and out of `query`; a phrase without an amount; 300-character input
- [x] T025 [P] [US2] `tools/aieval/cases/phrases.json` with at least 100 real Turkish phrases (breakfast, lunch, snacks, drinks, number words, negation, suffixes) and their expected foods and grams from the current portions; Zod loader `tools/aieval/src/cases.ts` (unknown food id fails)
- [x] T026 [P] [US2] `apps/mobile/tests/textPreviewLogic.test.ts` (fail first): grams from amount × the hit's matching portion, gram units, amount × first portion when only a number is given, typical portion with `estimated` when no amount; a negated word prefers a hit whose name contains it ("şekersiz çay" → `tea`); unmatched phrases listed; preview → draft keeps `estimated`

### Implementation

- [x] T027 [US2] `packages/core/src/text/parseMeal.ts` (unit labels passed in, so core stays free of the food list); export via the core package map; make T024 pass
- [x] T028 [US2] `apps/mobile/src/hooks/textPreviewLogic.ts` and `useTextPreview.ts` (debounced 300 ms; one `search_foods` call per phrase with `searchQuery`, cached per phrase; offline keeps the parsed amounts and marks phrases "bağlantı bekleniyor"); make T026 pass
- [x] T029 [US2] `tools/aieval/src/evalText.ts` and `score.ts`: score the preview on `phrases.json` through the same logic with the food list from `tools/fooddata` outputs (no network); write `tools/aieval/out/text.md`; fail under 90 %; add `npm run eval:text -w aieval` to `.github/workflows/ci.yml`
- [x] T030 [US2] `apps/mobile/src/components/ai/TextLogScreen.tsx` and the modal route `apps/mobile/src/app/log/text.tsx` per contracts/screens.md (300-character counter, live preview lines, "Kontrol et", "AI ile analiz et" through `useAiLog`); register the route in `_layout.tsx`; add the "Yazarak" button beside "Fotoğrafla" in `FoodSearchScreen.tsx`
- [x] T031 [P] [US2] Gallery entries "Yazarak: önizleme", "Yazarak: eşleşmeyen" in `tools/preview/src/PreviewGallery.tsx`
- [ ] T032 [US2] On the phone: quickstart §3 steps 3–5; record in `checklists/validation.md`

**Checkpoint**: text logging works with and without the AI.

---

## Phase 5: User Story 3 - Allowance and fallback (Priority: P2)

**Goal**: The user always sees what is left and always has a way to log.

**Independent Test**: Use up a test user's allowance; AI requests are refused with the reset time;
"Kontrol et" and search still save a meal; the allowance is back after local midnight (SC-006,
SC-007).

### Tests

- [x] T033 [P] [US3] `apps/mobile/tests/allowanceLogic.test.ts` (fail first): the Turkish line for 5…1 left, 0 left with the reset time in the user's zone ("00:00'da yenilenir"), unknown while loading; buttons disabled at 0 with the reason

### Implementation

- [x] T034 [US3] `apps/mobile/src/hooks/allowanceLogic.ts`, `useAllowance.ts` (TanStack Query key `["aiAllowance", userId]`, invalidated after every analysis) and `apps/mobile/src/components/ai/AllowanceLine.tsx` on `log/search`, `log/photo` and `log/text`; make T033 pass
- [x] T035 [US3] `limit_reached` and `ai_unavailable` states offer "Yazarak ekle" (preview only) and "Ara" on both AI screens (FR-016); the analyse buttons are disabled at 0
- [ ] T036 [US3] `tools/aieval/src/burst.ts`: 10 parallel requests with different keys plus one repeated key for a test user with 5 left; expect exactly 5 counted, the rest `limit_reached`, the repeat unchanged (quickstart §4, SC-006); run against dev and record the result in `checklists/validation.md`

**Checkpoint**: the allowance holds under pressure and the app never dead-ends.

---

## Phase 6: Model Choice & Polish

- [ ] T037 Owner's 30 weighed meals into `tools/aieval/cases/photos/` (resized with the app's settings) and `cases/photos.json`
- [ ] T038 `tools/aieval/src/eval.ts` per contracts/aieval.md (photos and phrases through `_shared/ai`, report recall, false positives, median weight error, latency p50/p90, tokens and cost at the paid price); run for `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`; commit `tools/aieval/out/*.md`; set `GEMINI_MODEL` on dev to the cheapest model meeting SC-001/SC-002 and note the choice in research.md §1
- [x] T039 [P] Docs: `supabase/README.md` (functions, secrets, Deno tests, deploy), `CLAUDE.md` (AI boundary, commands, layout), `README.md` (commands), `specs/ROADMAP.md` (003 status)
- [ ] T040 Run the full [quickstart.md](./quickstart.md) on the phone (including SC-004 timing over 4G and SC-005 under 30 s) and record results in `checklists/validation.md`; `npm test && npm run typecheck && npm run lint && npm run knip && npm run eval:text -w aieval && npm run test:functions -w @calorie/db` green

---

## Notes from implementation (2026-10-17)

- T001 was done with T019: knip fails on a dependency that nothing imports yet (constitution VI).
- T013: `ai-log` is deployed on dev (version 1, `verify_jwt` on). The `GEMINI_API_KEY` secret is
  not set yet (the owner enters it in the dashboard), so every analysis on dev answers
  `ai_unavailable` and releases the attempt; the text preview and search work. `GEMINI_MODEL` is
  unset and falls back to `gemini-3.5-flash-lite`.
- The function calls `ai_claim` / `ai_finish` as the service role through `public` wrappers
  (PostgREST cannot reach `private`); the caller's allowance is read with their own token.
- MCP `execute_sql` refuses any statement containing `delete`, so `ai_requests.test.sql` ran on dev
  without its delete-privilege line (25/25); the committed file keeps it.
- `tools/fooddata` also writes `out/foods.json`; `tools/aieval` reads it, so the text preview and
  the model are scored without a database. The search simulation ranks all 116 committed search
  cases as `search_foods` does.
- The phrase set (118) found three preview bugs, fixed: a bare count uses the `adet` portion, an
  exact unit beats a shorter one it starts with (şişe, not şiş), a lone unit word is the food
  ("1 dürüm"). "1 dürüm döner" stays a known miss (the unit word is part of the dish name).
- T038's script is written and type-checked; running it needs the key and the photos (T037).

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none; T002, T003, T004 in parallel after T001 or beside it.
- **Foundational (Phase 2)**: after Setup. T005 → T009 → T010; T006 → T011; T007 → T012 (needs T010, T011) → T013 (needs the owner's key); T008 → T015 → T016; T014 and T017 beside them.
- **US1 (Phase 3)**: after T013–T016. T018 → T019 → T020 → T021 → T023.
- **US2 (Phase 4)**: the preview part (T024–T029) needs only Phase 1 and T015, so it can start right after Setup; T030 needs T014/T019's `useAiLog`; T032 last.
- **US3 (Phase 5)**: after T014 and the AI screens (T020, T030).
- **Phase 6**: T037 whenever the owner has the meals; T038 after T011 and T037; T039–T040 last.

### Parallel Opportunities

- T002, T003, T004 together; T005, T006, T007, T008 together.
- The whole US2 preview track (T024–T029) beside the function work (T009–T013).
- Gallery tasks (T017, T022, T031) beside their stories.

## Parallel Example: Foundational tests

```bash
Task: "pgTAP supabase/tests/database/ai_requests.test.sql (fail first)"
Task: "Deno tests supabase/functions/_shared/ai/validate.test.ts (fail first)"
Task: "Deno tests supabase/functions/ai-log/index.test.ts (fail first)"
Task: "App logic tests apps/mobile/tests/mealLogic.test.ts (fail first)"
```

## Implementation Strategy

### MVP First

1. Phases 1–2: packages, allowance table, the function on dev, draft and review changes.
2. Phase 3 (US1): photo logging. **Stop and validate**: quickstart §3 steps 1–2.
3. Phase 4 (US2) and Phase 5 (US3) complete the store-MVP scope; Phase 6 picks the model once the
   owner's meals are in.

### Incremental Delivery (one commit series per phase, pushed to master per the owner's rule)

1. Setup + Foundational (T001–T017).
2. US2 preview track (T024–T029), which needs no key: can land first if the key is late.
3. US1 photo (T018–T023).
4. US2 AI screen + US3 (T030–T036).
5. Model choice and polish (T037–T040).
