# Feature Specification: Workout Program and Weight Progress

**Feature Branch**: `master` (owner's rule: calorie-tracker changes go straight to master)

**Created**: 2026-10-25

**Status**: Implemented; phone validation open

**Input**: Owner (2026-10-25): "Antrenman programı kısmı özelleştirilsin. Hareketleri ve set kiloları ve push pull legs, u/l gibi varyasyonları yazabilsin ve ağırlık takibi yapabildiği bir sistem geliştir ve uygulamaya ekle."

## Decisions (no clarify session; the owner asked for no questions)

- "Ağırlık takibi" is read as the weights lifted per exercise over time (it sits next to "set kiloları"). Body-weight tracking stays in 004 Tracking.
- One program per user. Changing the split means editing the program or picking a ready-made one; older workouts keep their own copy of what was done.
- The plan wizard's training style and split (001) still only shape the calorie plan; the workout program is separate. A first program starts from the split chosen in the wizard.
- Lifted weights are kg with decimals (62,5). Reps targets are free text ("8-12", "AMRAP").

## User Scenarios

### US1 - Build my program (P1)
The user opens the Antrenman tab, picks a ready-made split (Push / Pull / Legs, Upper / Lower, Full body, bro split) or starts empty, renames the split and its days, adds or removes days (1–7) and exercises (up to 15 a day), and types each exercise's sets, reps and target kg. Saving replaces the program.

**Acceptance**: a saved program shows on the tab with its days; a blank name or impossible number is refused with a Turkish message saying where ("2. gün, 1. hareket · ad: …").

### US2 - Log a workout (P1)
From a program day the user starts a workout: every exercise lists its sets with kg and reps filled from the last time it was done (or from the program's targets), adds or removes sets and saves it for today. Exercises left empty are not saved.

**Acceptance**: the saved workout appears under "Son antrenmanlar" with its exercise and set counts; it can be deleted after a confirmation.

### US3 - See my weight progress (P2)
The tab lists each logged exercise with its best kg; an exercise opens its progress: best kg, estimated 1RM (Epley), a chart of the heaviest set per workout, and every workout with its top set and volume.

**Acceptance**: three bench workouts at 57,5 / 60 / 62,5 kg show a rising chart and a best of 62,5 kg (plus the heavier set of the day if one was logged).

## Requirements

- **FR-001** One program per user: name, split label (free text ≤ 40), 1–7 days, each with ≤ 15 exercises (name, sets 1–10, reps text, target kg 0–500 or none).
- **FR-002** Ready-made splits fill the editor; nothing is saved until "Programı kaydet".
- **FR-003** A workout stores the date, the day's name and each exercise's sets (kg 0–500, reps 1–100), ≤ 30 exercises, ≤ 10 sets each.
- **FR-004** Exercises match across workouts by name, ignoring case and Turkish letters ("Bench Press" = "bench press").
- **FR-005** Rows are readable and writable only by their owner (RLS); the owner column comes from the token.
- **FR-006** All text Turkish; touch targets ≥ 44 pt; the tofuhq design (constitution).

## Success Criteria

- **SC-001** A first program from a template is saved in under a minute.
- **SC-002** Logging a 5-exercise workout with prefilled sets takes under 2 minutes.
- **SC-003** pgTAP and node tests cover the database rules, templates, editor and logger validation and the progress numbers.
