# Quickstart: AI Logging (003)

How to prove 003 works end to end. Contracts: [ai-log](./contracts/ai-log.md),
[screens](./contracts/screens.md), [aieval](./contracts/aieval.md); data: [data-model](./data-model.md).

## Prerequisites

- 001 and 002 part A running against the dev project (`kalori-takip-dev`); Expo Go on the phone
  (start Metro inside `apps/mobile`).
- `GEMINI_API_KEY` and `GEMINI_MODEL` set as Edge Function secrets on dev; the same key in the
  shell for the evaluation tool.

## 1. Automated checks

```bash
npm test && npm run typecheck && npm run lint && npm run knip
npm run eval:text -w aieval          # preview finds ≥ 90 % of phrases (SC-003, preview part)
npm run test:functions -w @calorie/db   # Deno: validation, auth, allowance, output checks
```

pgTAP on dev: `ai_requests.test.sql` (RLS, claim/finish, limit, retry, stale pending, local
midnight) passes.

## 2. Model choice (owner's 30 weighed meals)

```bash
npm run eval -w aieval -- --model gemini-3.5-flash-lite
npm run eval -w aieval -- --model gemini-3.1-flash-lite
npm run eval -w aieval -- --model gemini-3.6-flash
```

Pick the cheapest model that meets SC-001 (recall ≥ 80 %, false positives < 10 %) and SC-002
(median weight error ≤ 30 %); set it as `GEMINI_MODEL`; commit the three reports.

## 3. On the phone

1. Öğün ekle → "Fotoğrafla" → photograph a plate of mercimek çorbası and bread → the review step
   lists both with "tahmini" grams within about 8 s (SC-004). Change one weight, save: totals equal
   the same foods and grams logged by search (SC-008).
2. Photograph a wall → "Bu fotoğrafta yemek bulamadım"; the allowance line is unchanged (FR-014).
3. "Yazarak" → type "2 yumurta ve yarım simit" → the preview shows Yumurta 100 g and Simit 60 g as
   you type; "Kontrol et" opens the review step and the allowance is unchanged.
4. Type "şekersiz çay, iki yüz gram tavuk göğsü" → preview: Çay (şekersiz) and 200 g chicken breast.
5. "AI ile analiz et" on a phrase the preview misses → the review step fills; the allowance drops
   by one.
6. Use up the allowance → "Bugünlük AI hakkın bitti, 00:00'da yenilenir"; "Kontrol et" and search
   still log a meal (SC-007).
7. Set `GEMINI_MODEL` to an unknown id on dev → a photo gives "Fotoğraf analizi şu an çalışmıyor",
   the allowance is unchanged, typing and search still work. Restore the secret.
8. Time a three-food plate from "Fotoğrafla" to saved, with one weight changed: under 30 s (SC-005).

## 4. Allowance under pressure (SC-006)

Send 10 parallel `ai-log` requests with different keys for a user with 5 left: exactly 5 succeed
(or are released), the rest get `limit_reached`; resending one key returns the same body without
a new count.
