# Feature Specification: Weekly Training Plan and Feedback

**Created**: 2026-10-26 · **Status**: Engine, data and basic screens done; design pass, notification, exercise catalogue and phone validation open

**Input**: Owner (2026-10-26): the workout system lives in its own tab, apart from the diet part; using the weight data it gives weekly feedback; at the end of every week (Sunday evening) it programs the next week's training plan and intensity, so a plan prepared in advance strengthens the routine.

## Decisions

- **Separate tab.** Training stays in the Antrenman tab; the diet tabs (Bugün, Geçmiş, Planım) show nothing of it. The plan wizard's training style keeps shaping calories only.
- **"Ağırlık verileri"** = the logged kg × reps (007). Body weight stays in 004.
- **Rule-based, on the device, no AI.** The same numbers on every device, testable, free; an AI-written summary can come later behind the 003 boundary.
- **Sunday 18:00 local** starts the next week's planning. The plan is built when the app is opened from then on (and for any week that has none); a Sunday 19:00 local notification brings the user in. No server cron in this version (see plan.md).

## User Scenarios

### US1 - A week planned in advance (P1)
From Sunday 18:00 the Antrenman tab shows "Gelecek hafta": dated days on the program's weekdays (or spread over the week), the rotation going on from the last day done, every exercise with sets, reps and kg to aim for and why ("kilo arttı", "+1 tekrar", "aynı", "hafif hafta").
**Acceptance**: after a week where bench press was 3 × 8 at 60 kg in a 6–8 range, next week's bench target is 62,5 kg × 6.

### US2 - Weekly feedback (P1)
Each week's plan opens with a look back at the week before: workouts done against the plan, total volume against the week before, new records, exercises with no progress in three workouts.
**Acceptance**: 2 of 3 planned workouts → "Planlanan 3 antrenmandan 2 tanesi yapıldı."; a heavier best → "Yeni rekor: …".

### US3 - Intensity that follows the user (P2)
Every sixth week, or when ≥ 40 % of the tracked exercises stall, is a deload (≈ −10 % kg, one set fewer); after a week with less than half the plan done, weights hold ("hafif hafta"). Never two deloads in a row.

### US4 - Log a planned day (P1)
A planned day opens the logger with every set at the planned kg and reps; the user ticks what they did.

## Requirements
- **FR-001** One plan per user and week (Monday), stored; never overwritten by a second device; rewritten only by a replan after a program change.
- **FR-002** Programs have training weekdays (Monday = 0); empty spreads the days (2 → Mon/Thu, 3 → Mon/Wed/Fri …).
- **FR-003** Double progression per exercise (data-model.md); 1 kg steps under 20 kg, 2,5 kg above; rep text like "AMRAP" holds.
- **FR-004** Only workouts before the week count, so planning again gives the same plan.
- **FR-005** Owner-only rows (RLS); Turkish text; 44 pt targets.
