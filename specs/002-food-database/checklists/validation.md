# Validation: 002 food database, part A

Run 2026-10-16 by the owner on an iPhone (Expo Go) against the dev project after food list 2
(T023). Results as the owner reported them.

## Quickstart §5, on the phone

| Step | Check | Result |
| --- | --- | --- |
| 5.1 | "yumurta" finds "Yumurta" first | Pass |
| 5.2 | "adet" chip and "+" set the grams; totals follow | Pass ("prezisyonlu") |
| 5.3 | Typing grams deselects the chip; the meal keeps the typed grams | Not reported on the phone; covered by `apps/mobile/tests` (`setDraftGrams` clears the portion) |
| 5.4 | "sut" finds the same food as "süt" | Pass ("tavuğu" and "pilavi" not reported separately; all 116 search cases pass on dev) |
| 5.5 | "pirinç" lists "Pirinç (çiğ)" before "Pirinç pilavı (pişmiş)" | Pass |
| 5.6 | Results within 300 ms of the last keystroke (SC-006) | Owner saw no delay. Server time for `search_foods('mercimek çorbası çorba')` is 21 ms (`explain analyze` on dev); the phone round trip was not timed. |
| 5.7 | Profil → "Veri kaynakları" shows the USDA credit | Pass |

## Earlier sections

- §1–2 build and rules: `npm run build -w fooddata` and the rule tests (`tools/fooddata/tests`) pass.
- §3 owner review: signed off 2026-10-16 (T032).
- §4 dev project: T023 (tasks.md notes): 461 / 961 / 383 rows equal to the file, 116 / 116 search cases first, the existing day unchanged.

## Automated checks

`npm test` (81 + 44 + 35), `npm run typecheck`, `npm run lint`, `npm run knip`, `npm run check -w fooddata`: green on 2026-10-16; CI on master green.
