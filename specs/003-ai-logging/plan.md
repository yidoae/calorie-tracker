# Implementation Plan: AI Logging

**Branch**: `003-ai-logging` | **Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-ai-logging/spec.md`

## Summary

Log a meal from a photo or a short Turkish text. One Edge Function, `ai-log`, is the only code
that talks to Gemini (`generateContent` with a JSON schema whose food ids are an enum of our
searchable foods); it validates the answer again, enforces a database-backed daily allowance of 5
(retries and failures do not count) and returns foods and grams that fill the existing meal
draft and review step. Photos are shrunk on the device and never stored. A pure Turkish text
parser in `@calorie/core` gives an instant preview through the existing food search without the
model or the allowance. A never-shipped `tools/aieval` workspace scores candidate models on the
owner's 30 weighed meals and 100+ phrases to choose `GEMINI_MODEL`.

## Technical Context

**Language/Version**: TypeScript (strict) in the app, core and tools; TypeScript on Deno 2 for the
Edge Function; SQL (PostgreSQL 17 on Supabase).

**Primary Dependencies**: new in the app: `expo-image-picker`, `expo-image-manipulator` (Expo SDK
57, Expo Go compatible), installed with `npx expo install`. Function: no SDK; `fetch` to
`generativelanguage.googleapis.com`, Zod 4 via `npm:` specifier, `@supabase/supabase-js` via
`npm:` for the service-role calls. Tools: `tsx`, the function's shared AI module.

**Storage**: Supabase Postgres: new `ai_requests` table and `private.ai_claim` / `ai_finish`,
`public.ai_allowance()` ([data-model.md](./data-model.md)). No storage bucket. Evaluation photos
(resized, ~9 MB) and case files in the repository.

**Testing**: core: `node:test` for `parseMeal` (number words, units, negation, splitting) plus the
phrase set; app: node tests for the draft changes (`estimated`, `unmatched`) and the
preview-to-draft mapping; database: pgTAP `ai_requests.test.sql`; function: Deno tests with a
fake model (validation, auth, limits, retry, output checks); `eval:text` in CI; Maestro smoke
flow unchanged (AI needs a key; covered by quickstart §3).

**Target Platform**: iOS first (store MVP), Android unchanged; Supabase Edge Functions (Deno 2).

**Project Type**: mobile app + backend-as-a-service (npm-workspaces monorepo) + internal tools.

**Performance Goals**: 90 % of photo analyses reach the review step within 8 s on 4G (SC-004);
preview within 300 ms of the last keystroke; function timeout 20 s.

**Constraints**: model output never sets nutrition values; ids only from our list; grams
0 < g ≤ 5000, at most 30 items; image ≤ 1600 px and body ≤ 1.5 MB; text ≤ 300 characters;
allowance 5 per local day; no key in the app or repository; no photo stored.

**Scale/Scope**: 1 migration, 1 Edge Function with a shared module, 1 core module, 2 new
screens, 2 changed screens, 1 new tool workspace; cost about $0.003–0.007 per analysis
(research §1).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
|---|---|---|
| I. Layered mobile architecture | Screens in `app/log/{photo,text}.tsx` → components in `components/ai` → hooks (`useAiLog`, `useTextPreview`, `useAllowance`) with pure `*Logic.ts` → `services/aiService.ts` (the only caller of the function) → `@calorie/core` (`parseMeal`, schemas) | Pass |
| II. Validated boundaries | Request and response Zod schemas in core, used by the app and (copied as the shared module's types) the function; model JSON validated in the function; RPC rows validated in the service | Pass |
| III. Server-owned numbers | The function returns food ids and grams only; values per 100 g come from `foods`; totals from `log_meal` as today | Pass |
| IV. User confirms the grams | Every path ends on `log/review`; estimated grams are marked; nothing saves without the user | Pass |
| V. One AI boundary | `supabase/functions/_shared/ai/` is the only vendor caller; schema enum of our ids; model chosen on the committed eval set; the preview and search work without the model | Pass |
| VI. Only code we use | Each new module has a caller; `tools/aieval` and the new packages are in knip; no photo storage code | Pass |
| VII. Turkish first | All states and errors in Turkish; parser tested on number words, suffixes and negation | Pass |
| VIII. Secure and abuse-limited | JWT verified; size limits before the model; persistent per-user allowance with row locks; images re-encoded on device (EXIF gone); key only as a secret; `ai_requests` under RLS, functions in `private` | Pass |
| IX. Tested and measured | Deno tests for validation, auth and quota; pgTAP for the table and functions; the eval report goes into the PR that picks or changes the model | Pass |

Post-design re-check (after data model and contracts): no violations; no complexity tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-ai-logging/
├── plan.md              # This file
├── research.md          # Phase 0: model and call, id enum, photo, allowance, parser, flow, eval
├── data-model.md        # Phase 1: ai_requests, functions, draft changes, eval files
├── quickstart.md        # Phase 1: checks, model choice, phone walk-through
├── contracts/
│   ├── ai-log.md        # function request/response/errors, ai_allowance RPC
│   ├── screens.md       # log/search, log/photo, log/text, log/review
│   └── aieval.md        # evaluation commands and report
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
supabase/
├── migrations/<v>_ai_requests.sql          # table, RLS, ai_claim, ai_finish, ai_allowance
├── functions/
│   ├── ai-log/index.ts                     # auth, size checks, claim → model → validate → finish
│   ├── ai-log/index.test.ts                # Deno tests with a fake model
│   └── _shared/ai/                         # prompt builder, response schema, Gemini call, output checks
│                                           #   (plain TS, no Deno globals: also imported by tools/aieval)
├── config.toml                             # [functions.ai-log] verify_jwt = true
├── package.json                            # + test:functions (deno test)
└── tests/database/ai_requests.test.sql
packages/core/src/
├── text/parseMeal.ts                       # on-device preview parser
├── schemas/ai.ts                           # request/response/allowance schemas
└── db/database.types.ts                    # regenerated
packages/core/tests/parseMeal.test.ts
apps/mobile/src/
├── app/log/photo.tsx · text.tsx            # new modals
├── components/ai/PhotoCapture.tsx · TextLogScreen.tsx · AllowanceLine.tsx
├── components/meals/FoodSearchScreen.tsx   # + Fotoğrafla / Yazarak, allowance line
├── components/meals/MealReviewScreen.tsx · DraftItemCard.tsx   # tahmini, Eşleşmeyenler
├── hooks/useAiLog.ts · useTextPreview.ts · useAllowance.ts · textPreviewLogic.ts
├── hooks/mealLogic.ts · useMealDraft.ts    # estimated, unmatched, fill from AI result
└── services/aiService.ts · errorMessages.ts
apps/mobile/tests/textPreviewLogic.test.ts · mealLogic.test.ts
tools/aieval/                               # new workspace, never shipped
├── cases/photos/*.jpg · photos.json · phrases.json
├── src/eval.ts · evalText.ts · score.ts
└── out/*.md                                # committed reports
tools/preview/src/fakes/aiService.ts        # fake analysis for the screen gallery
.github/workflows/ci.yml                    # + eval:text, + Deno function tests
knip.json                                   # + tools/aieval, functions
```

**Structure Decision**: The first Edge Function lives under `supabase/functions` (Supabase CLI
layout) with a `_shared/ai` module that holds every vendor detail; the evaluation is a third
`tools/*` workspace. The app keeps the 001 layers; AI screens get their own component folder.

## Complexity Tracking

No violations.
