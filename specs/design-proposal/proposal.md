# Design proposal: same colours, faster app

**Status:** awaiting the owner's approval (no app code changed).
**Artifact (before/after mockups):** https://claude.ai/artifact/JB1RzudP7itwF8i4PKPH75
**Source of the artifact:** `proposal.html` in this folder.
**Author:** Art Director, first pass, 2026-10-25.

The colours, Bricolage Grotesque headings and the tofuhq look stay. What changes is hierarchy,
density and the number of taps in the two most frequent flows (logging food, logging a set). The
only token addition is a light tint of each macro colour.

## Apps studied

| App | Licence | Lesson |
|---|---|---|
| [OpenNutriTracker](https://github.com/simonoppowa/OpenNutriTracker) | GPL-3.0 | One hero number, "kcal left"; when exceeded the label becomes "too much" and the gauge turns red; eaten/burned as small side stats. |
| [Waistline](https://github.com/davidhealey/waistline) | GPL-3.0 | Diary split by meal; every meal header carries its kcal and its own "+", empty meals included. |
| [Open Food Facts smooth-app](https://github.com/openfoodfacts/smooth-app) | Apache-2.0 | Search first; nutrient values as coloured chips scanned at a glance. |
| [wger flutter](https://github.com/wger-project/flutter) | AGPL-3.0 | Macro target vs actual side by side; compact set rows under the target line. |
| [Flex](https://github.com/brandonp2412/Flex) | MIT | Stepper fields for weight/reps, prefill from the previous set, automatic rest timer, strip of done sets. |
| [Liftosaur](https://github.com/astashov/liftosaur) | AGPL-3.0 | A set is one tap to mark done; editing is secondary. Fastest workout logging pattern. |
| [LibreFit](https://github.com/LibreFitOrg/LibreFit) | GPL-3.0 | Keyboard-free number picker; empty states with one sentence and one action. |

Only patterns were taken; no code or assets.

## Principles

1. **One hero number per screen**: "kcal left" on Today, "sets done" in the workout logger.
2. **Logging in three taps**: search → tap → portion chip → add. Typing grams stays possible.
3. **Empty meals are visible**: all four slots listed, each with its own "+", so the slot is known
   before searching. Lime only on the next slot (one primary action per screen).
4. **A set is one tap "done"**: the previous value is shown in the row, ✓ confirms, the rest timer
   starts by itself.
5. **Outline = tappable**: the dark 1 px outline only on cards you tap; information groups are
   filled with `surface2` and have no outline.
6. **Macro tints**: `proteinSoft #f6e6fd`, `carbsSoft #e3f0fc`, `fatSoft #eef7dc` for chips and tiles.

## Screen by screen

| Screen | Today | Proposal | Source |
|---|---|---|---|
| Today | Ring + three full-width bars fill ~60 % of the first screen; empty slots hidden; one "Öğün ekle". | Kcal left in the ink band with a thin lime bar; three macro tiles ("kaldı"); four slot rows with "+"; date switcher in the band. | OpenNutriTracker, Waistline |
| Food search | Blank until two letters; AI buttons above the input. | Input in the band, keyboard open; recents and frequent foods when empty; photo/text as icons in the field. | OFF, OpenNutriTracker |
| Portion | Grams typed on the review screen. | Bottom sheet on tap: macro chips, portion chips (½, 1, 100 g, last used), ± stepper. | Flex, LibreFit |
| Review | Each card: label + two lines of hint; four foods ≈ 2.3 screens. | One row per food with a grams pill; hint once; estimated grams in violet tint; unmatched with dashed red outline; total card shows what is left of the day; button names the slot. | wger |
| AI photo | Large empty white area. | Viewfinder card with a top-down plate sketch; allowance as a pill in the band. | OFF scanner |
| AI text | Empty text box. | Tappable example chips below the box. | LibreFit |
| Meal | Good. | Macro-tinted mini chips; "Öğünü sil" as ghost danger text. | OFF |
| History | Status only as a 4 px coloured dot (colour-only, small). | Filled tinted day cells with a mark (✓ ↓ ↑); weekly average strip. | Waistline, accessibility |
| Plan | Long explanation first. | Kcal + stacked macro bar first; explanation folds under "Neden bu hedef?". | OpenNutriTracker |
| Plan wizard | Live preview takes ~30 % on every step. | One-line sticky preview strip that expands on tap. | Flex |
| Fine-tune | Good. | Macro rows on their tint; % and g/kg on one line. | — |
| Setup 1–6 | Clean; step counter is text. | Six-part step bar in the band. | — |
| Profile | Uppercase labels and plain text. | Grouped list rows; sign out last as danger text. | wger settings |
| Workout tab | Three equal day cards, all with "Başla". | Next day as hero card with lime "Başla"; others plain rows; sparkline in weight progress. | Flex, Liftosaur |
| Program editor | Five vertical preset cards; long days. | Presets as horizontal chips; days as accordions; "4 × 6-8 · 60 kg" on one line. | Liftosaur |
| Workout logger | Two empty boxes and an ✕ per set; done vs not done invisible. | ✓ per set (row turns lime tint), "previous" column, target as placeholder, band shows "6 / 10 sets" and time, rest timer above the button, delete by swipe/long press. | Liftosaur, Flex |
| Exercise progress | Stat labels wrap ("ANTRENMA N"); chart without grid. | Shorter labels; area fill, grid and highlighted last point. | Flex |

## Non-design findings (left for Tester)

- Calorie cycling gives a rest-day carb target of 0 g (preview: "Karbonhidrat 120 / 0 g",
  "Dinlenme günü 1.440 kcal · K 0").
- In the web preview the workout logger's reps input overflows the card; `minWidth: 0` on
  `CompactInput` fixes it if it shows on a device.

## Decisions for the owner

1. The direction: the six principles above.
2. Macro tints added to `theme.ts`.
3. Today: band number + bar instead of the ring.
4. Date switcher on Today (small behaviour: route parameter).
5. "Add yesterday's meal" shortcut (new feature: service + hook, separate task).
6. Workout: ✓ per set and rest timer (behaviour change: undone sets are not saved; timer is new).
7. ± stepper in the portion sheet (10 g steps, 1 for piece units).

Approved items land as small separate changes: Today, then search/review, then the workout logger,
each with tests and a fresh preview.
