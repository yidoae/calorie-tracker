# Research: AI Logging (003)

Decisions behind [plan.md](./plan.md). Gemini facts were checked on 2026-10-16 against
ai.google.dev (models, pricing, structured output, `generateContent` reference).

## 1. Model and call

- **Decision**: One Supabase Edge Function, `ai-log`, calls the Gemini REST endpoint
  `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with
  `generationConfig.responseMimeType = "application/json"` and a `responseSchema`. The model id comes
  from the `GEMINI_MODEL` secret so a change needs no deploy. Candidates, chosen by the evaluation
  set (§7): `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`. Development starts
  on `gemini-3.5-flash-lite`; thinking is kept at the lowest setting the model allows.
- **Rationale**: `generateContent` is the documented, non-deprecated method with JSON-schema output
  and inline images; one REST call needs no SDK in Deno. Paid prices per 1M tokens (input / output):
  3.1 Flash-Lite $0.25 / $1.50, 3.5 Flash-Lite $0.30 / $2.50, 3.6 Flash $0.75 / $3.75 (rising to
  $1.50 / $7.50 on 2027-01-01). A call is about 8k input tokens (instructions, the food list, one
  image) and 300 output tokens: roughly $0.003 on Flash-Lite and $0.007 on Flash, so 5 a day per
  user stays under $1 per user per month even on Flash.
- **Alternatives**: the newer Interactions endpoint (`/v1beta/interactions`, `response_format`):
  rejected for now, `generateContent` is what the reference documents for images plus schema and
  the boundary module can switch later. Files API uploads: unnecessary for one small image.
  Gemini 3.8 Flash: same price as 3.6 Flash, added as a candidate only if Flash-Lite fails SC-001.

## 2. Keeping the model inside our food list

- **Decision**: The response schema is
  `{ items: [{ food_id: enum<ids>, grams: number, estimated: boolean }], unmatched: [{ description: string, grams?: number }] }`
  where the enum holds every searchable food id. The prompt lists each food as
  `id · Türkçe ad · typical portion g`, so the model maps what it sees to our names. The function
  reads the list once per cold start from `foods` and builds both. After the call it validates the
  JSON again (Zod in the function): ids must exist and be searchable, grams must be > 0, grams above
  5000 are capped and flagged, duplicate ids are merged by summing grams, at most 30 items.
- **Rationale**: constitution V requires identifiers from our database; an enum makes an invented
  id impossible, the second validation covers schema features the API ignores. The list (461 ids,
  about 6k tokens) is small enough to send whole; no retrieval step.
- **Alternatives**: free-text names matched afterwards with `search_foods`: loses the model's
  context ("pilav" on a plate next to köfte is rice pilav) and fails silently on wrong matches.
  Retrieval of the top-k foods per image: needs embeddings or a first pass, more cost and code.

## 3. Photo on the device

- **Decision**: `expo-image-picker` (camera or library, one photo) and `expo-image-manipulator`
  (resize to 1024 px on the long edge, JPEG quality 0.7). The re-encoded image carries no EXIF or
  location. It is sent as base64 inside the JSON body. The function rejects bodies over 1.5 MB and
  images whose decoded size exceeds 1600 px on a side. Nothing is written to storage (FR-005).
- **Rationale**: both modules run in Expo Go and are Expo SDK 57 packages; 1024 px keeps plates
  recognisable at about 150–300 KB. Base64 in the body avoids a storage bucket and its policies.
- **Alternatives**: upload to a private bucket and pass the path: an extra round trip, a bucket to
  secure and clean up, and a stored photo the owner chose not to keep.

## 4. Daily allowance

- **Decision**: One table, `ai_requests`, one row per analysis attempt with the user, a
  client-made `request_key` (unique per user), kind, local date, status
  (`pending` → `counted` | `released`), model, latency, token counts and the validated result
  (food ids and grams, never the image). A `security definer` function `private.ai_claim` runs in
  the function with the user's id: it locks the user's rows for the local date, refuses when
  `pending` + `counted` reach the limit (5, one SQL constant `private.ai_daily_limit()`), returns
  the stored result when the key already exists, otherwise inserts `pending`. `private.ai_finish`
  sets `counted` with the result, or `released` when the call failed, timed out or found no food.
  The local date comes from `profiles.time_zone`. `public.ai_allowance()` (RPC) returns used,
  limit and the next local midnight for the app.
- **Rationale**: a row per attempt gives retries-count-once (FR-014), concurrency safety (SC-006,
  the row lock), cost and latency data for the evaluation (FR-018) and abuse traces, in one table.
  Reserving before the call stops a burst of parallel requests from passing the limit.
- **Alternatives**: a counter table per user and day: no idempotency or audit, and still needs a
  lock. Counting in the Edge Function's memory: functions are stateless.

## 5. On-device text preview

- **Decision**: A pure parser in `@calorie/core` (`text/parseMeal.ts`): split on commas, "ve",
  "ile", "+" and new lines; read an amount (digits with comma decimals, "bir"…"dokuz yüz",
  "yarım", "buçuk", "çeyrek") and a unit (gram words "g", "gr", "gram"; otherwise any portion unit
  label from the food list, "adet", "dilim", "kase", "su bardağı", …); drop words with a negation
  suffix (-sız/-siz/-suz/-süz) from the search query but keep them to prefer foods whose name
  contains them ("şekersiz çay" → "Çay (şekersiz)"). The app searches each phrase with the
  existing `search_foods` (one call per phrase, debounced 300 ms) and takes the first hit. Grams:
  amount × the hit's portion for the unit, amount in grams for gram units, amount × the first
  portion when only a number is given, the typical portion (flagged as an estimate) when no amount
  is given.
- **Rationale**: the preview needs no model and no allowance (FR-007) and reuses the search that
  already ranks 116 / 116 everyday queries first. Keeping it in core makes it testable under node and
  shared with the evaluation tool.
- **Alternatives**: a local copy of the food list on the device for offline matching: 461 foods is
  small but adds sync and versioning; search already works with a connection, and offline the
  preview still shows the parsed amounts (spec edge case).

## 6. Flow in the app

- **Decision**: The search modal gets two actions above the field, "Fotoğrafla" and "Yazarak".
  `log/photo` takes or picks the photo, shows the allowance and an analysing state, and on success
  fills the existing meal draft; `log/text` shows the text field with the live preview, a
  "Kontrol et" button (preview results, no allowance) and "AI ile analiz et" (allowance). Both end
  on the existing `log/review`. The draft gains an `estimated` flag per item and an `unmatched`
  list shown on the review step with a "Ara" button prefilled with the description.
- **Rationale**: one review step and one draft for every path (constitution IV, FR-004); the search
  modal is already where "Öğün ekle" leads.
- **Alternatives**: a new chooser screen before search: one more tap on the most common path.

## 7. Evaluation set and tool

- **Decision**: A never-shipped workspace `tools/aieval`: `cases/photos/<id>.jpg` (resized like the
  app does) with `cases/photos.json` (foods and weighed grams per photo), `cases/phrases.json`
  (≥ 100 phrases with expected foods and grams). `npm run eval -w aieval -- --model <id>` calls
  Gemini directly with the same prompt builder and schema as the function (shared module) and
  writes `out/<model>.md`: SC-001 recall and false-positive rate, SC-002 median weight error,
  latency p50/p90 and cost per call from the reported token counts. `npm run eval:text -w aieval`
  scores only the on-device parser and runs in CI without a key (SC-003 preview part).
- **Rationale**: FR-018 asks for a committed set and a measured choice; sharing the prompt and
  schema module means the evaluation scores exactly what users get.
- **Alternatives**: evaluating through the deployed function: needs a signed-in user and burns the
  allowance; direct calls with a developer key are simpler.

## 8. Failure and limits

- **Decision**: The function times the model out at 20 s and the app at 25 s. Model errors,
  timeouts, empty results and invalid JSON release the attempt (FR-014) and return a typed error
  code the app maps to Turkish text (`services/errorMessages.ts`): `ai_unavailable`,
  `ai_no_food`, `ai_limit_reached` (with `resets_at`), `ai_bad_image`, `ai_too_large`. Text over
  300 characters and bodies over 1.5 MB are refused before the model is called.
- **Rationale**: users must always have a next step (FR-016); codes keep the boundary testable.

## 9. Secrets and deployment

- **Decision**: `GEMINI_API_KEY` and `GEMINI_MODEL` as Supabase Edge Function secrets (dev: the
  owner's free-tier key; production: the paid key before TestFlight). The function is deployed
  with the Supabase CLI or MCP `deploy_edge_function`; `verify_jwt` stays on.
- **Rationale**: constitution V and VIII: no key in the app or the repository.
