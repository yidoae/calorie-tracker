# Contract: `ai-log` Edge Function and allowance RPC

## `POST /functions/v1/ai-log`

Called by `services/aiService.ts` with the user's session (`Authorization: Bearer <access token>`,
`verify_jwt` on). Body at most 1.5 MB.

### Request

```json
{ "request_key": "uuid", "kind": "photo", "image": "<base64 JPEG>" }
{ "request_key": "uuid", "kind": "text", "text": "2 yumurta, yarım simit" }
```

- `request_key`: new per attempt, reused only to retry the same attempt.
- `photo`: `image` required, JPEG, decoded at most 1600 px on a side.
- `text`: `text` required, 1–300 characters after trimming.
- Anything else → `400 invalid_request`.

### Response 200

```json
{
  "items": [
    { "food_id": "lentil_soup", "grams": 250, "estimated": true },
    { "food_id": "white_bread", "grams": 30, "estimated": true }
  ],
  "unmatched": [{ "description": "turşu suyu", "grams": 100 }],
  "allowance": { "used": 3, "limit": 5, "resets_at": "2026-10-17T00:00:00+03:00" }
}
```

- `items`: 1–30 entries; every `food_id` exists and is searchable; `0 < grams ≤ 5000`; one entry per
  food (duplicates summed). The app loads the foods' names, values and portions with the existing
  food queries before showing the review step.
- `estimated`: false only when the text stated an amount the grams were computed from.
- `unmatched`: things the model saw or read but could not map; may be empty.
- A retry with the same `request_key` returns the stored body without a new model call or count.

### Errors

| Status | `error` | When | Counts? |
|---|---|---|---|
| 400 | `invalid_request` | bad body, unknown kind, text length | no |
| 401 | `not_authenticated` | no or invalid session | no |
| 413 | `too_large` | body over 1.5 MB or image over 1600 px | no |
| 422 | `bad_image` | not a decodable JPEG | no |
| 422 | `no_food` | the model found nothing it could map or describe | no |
| 429 | `limit_reached` | allowance used up; body has `resets_at` | no |
| 503 | `ai_unavailable` | model error, timeout (20 s) or invalid output after one retry | no |

Body: `{ "error": "<code>", "resets_at"?: "<ISO>" }`. The app maps each code to Turkish text in
`services/errorMessages.ts`.

## `public.ai_allowance()` RPC

`select * from ai_allowance()` as `authenticated` →
`{ used integer, "limit" integer, resets_at timestamptz }` for the caller's local day.
`anon` cannot call it.

## Access matrix additions

| Object | authenticated | anon |
|---|---|---|
| `ai_requests` | select own rows | none |
| `ai_allowance()` | execute | none |
| `private.ai_claim`, `private.ai_finish` | none (service role inside `ai-log`) | none |
