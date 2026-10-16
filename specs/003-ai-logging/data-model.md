# Data Model: AI Logging (003)

One new table and three functions in the database; two in-memory shapes in the app. Foods,
portions, meals and meal items are unchanged (saved meals from AI paths are ordinary meals).

## `public.ai_requests` (new)

One row per analysis attempt (photo or text). Never holds the image or the typed text.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | primary key, default `gen_random_uuid()` |
| `user_id` | uuid | not null, references `auth.users` on delete cascade |
| `request_key` | uuid | not null; made by the app per attempt; `unique (user_id, request_key)` |
| `kind` | text | not null, `check (kind in ('photo', 'text'))` |
| `local_date` | date | not null; the user's date in `profiles.time_zone` when claimed |
| `status` | text | not null, `check (status in ('pending', 'counted', 'released'))`, default `pending` |
| `model` | text | null until finished |
| `latency_ms` | integer | null until finished, `>= 0` |
| `input_tokens`, `output_tokens` | integer | null until finished, `>= 0` (cost) |
| `result` | jsonb | null until `counted`; the validated response body ([contract](./contracts/ai-log.md)) |
| `error` | text | null unless `released`; one of the error codes |
| `created_at` | timestamptz | not null, default `now()` |
| `finished_at` | timestamptz | null until finished |

- Index `(user_id, local_date)` for the allowance count.
- RLS on; policy: a user selects their own rows (`user_id = auth.uid()`); no insert, update or
  delete grants to `anon` or `authenticated` (rows change only through the functions below).

### State transitions

```text
(claim) ──► pending ──(model answered with ≥ 1 food)──► counted
                    └─(error, timeout, no food, invalid output)──► released
```

A `pending` row older than 2 minutes counts as `released` for the allowance (a crashed function
must not eat the user's allowance); `ai_finish` refuses to finish it afterwards.

## Functions

| Function | Caller | Behaviour |
|---|---|---|
| `private.ai_daily_limit()` | SQL | returns 5 |
| `private.ai_claim(user_id, request_key, kind)` | `ai-log` (service role) | locks the user's rows for today's local date; existing key → returns its row (and `result` when `counted`); `pending` (younger than 2 min) + `counted` ≥ limit → `limit_reached` with the next local midnight; else inserts `pending` and returns it |
| `private.ai_finish(id, status, model, latency_ms, input_tokens, output_tokens, result, error)` | `ai-log` | sets the final status once; `counted` needs a `result` with ≥ 1 item |
| `public.ai_allowance()` | app (authenticated RPC) | `{ used, limit, resets_at }` for `auth.uid()` and today's local date |

Bodies live in the `private` schema with `set search_path = ''` (001 convention); only
`ai_allowance` is granted to `authenticated`.

## App, in memory

### Meal draft (changed, `hooks/mealLogic.ts`)

- `DraftItem` gains `estimated: boolean` (true when the grams came from a model estimate or a
  typical portion; cleared when the user types grams or picks a portion).
- `MealDraft` gains `unmatched: { key, description, grams? }[]`; each is shown on the review step
  and removed when the user picks a food for it or dismisses it. Unmatched entries are never saved.

### Text preview (new, `@calorie/core/text/parseMeal.ts`)

`parseMeal(text) → ParsedPhrase[]` with
`{ phrase: string, query: string, amount: number | null, unit: string | null, unitKind: 'gram' | 'portion' | null, negated: string[] }`;
`query` is what the app sends to `search_foods`. Pure, no I/O.

## Evaluation set (repository, `tools/aieval/cases`)

- `photos.json`: `[{ id, file, taken, items: [{ food_id, grams }] }]`, grams from the kitchen scale.
- `phrases.json`: `[{ text, items: [{ food_id, grams }] }]`.
- Both validated by Zod at load; every `food_id` must exist in the current list.
