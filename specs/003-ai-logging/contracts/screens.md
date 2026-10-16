# Contract: Screens (003)

All text Turkish with "sen". Existing screens change only where listed.

## `log/search` (changed)

Above the search field, two secondary buttons: "Fotoğrafla" → `log/photo`, "Yazarak" → `log/text`.
The line under them shows the allowance: "Bugün 3 AI kaydın kaldı" / "Bugünlük AI hakkın bitti,
00:00'da yenilenir".

## `log/photo` (new, modal)

1. Choice: "Fotoğraf çek" (camera) or "Galeriden seç". Camera and photo-library permission asked
   on first use; on refusal, a line explaining how to allow it in Settings.
2. Preview of the shrunk photo with "Analiz et" (disabled with the reason when the allowance is
   used up) and "Yeniden çek".
3. Analysing state with a cancel button; on success the draft is filled and the app moves to
   `log/review`. On `no_food`: "Bu fotoğrafta yemek bulamadım" with "Yeniden çek", "Yazarak ekle",
   "Ara". On `ai_unavailable`: "Fotoğraf analizi şu an çalışmıyor" with "Yazarak ekle", "Ara".

## `log/text` (new, modal)

- Multiline field (300 characters, counter). Under it the live preview: one line per phrase with the
  matched food, grams (marked "tahmini" when estimated) or "bulunamadı".
- "Kontrol et": fills the draft from the preview (no allowance) and opens `log/review`.
- "AI ile analiz et": sends the text (allowance), fills the draft from the answer, opens
  `log/review`. Errors as in `log/photo`.

## `log/review` (changed)

- Items with `estimated` show "tahmini" next to the grams until the user edits them.
- An "Eşleşmeyenler" section lists unmatched descriptions, each with "Ara" (opens `log/search`
  prefilled, the picked food replaces the entry) and a dismiss button.
- Saving is unchanged.
