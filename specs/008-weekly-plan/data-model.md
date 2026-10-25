# Data Model: Weekly Training Plan

Migration `supabase/migrations/20261026000100_workout_weeks.sql`; test `supabase/tests/database/workout_weeks.test.sql` (11/11 on dev); schemas `packages/core/src/schemas/workout.ts`; engine `packages/core/src/workout/{plan,review}.ts` (tests `packages/core/tests/weeklyPlan.test.ts`).

## workout_programs.weekdays
`smallint[]`, values 0–6 (Monday = 0), at most 7, default `{}`.

## workout_weeks (one row per user and week)

| Column | Type | Rule |
|---|---|---|
| user_id | uuid → profiles | default `auth.uid()`, part of the PK |
| week_start | date | a Monday (`isodow = 1`), part of the PK |
| intensity | text | `normal`, `light`, `deload` |
| plan | jsonb | ≤ 7 `{ date, name, exercises: [{ name, sets, reps, kg, change }] }`, ≤ 32 kB |
| feedback | jsonb | null or `{ weekStart, sessionsDone, sessionsPlanned, volume, volumeChangePct, records, stalled, headline, notes }`, ≤ 16 kB |
| created_at | timestamptz | |

RLS read/insert/update own. Grants: select; insert `week_start, intensity, plan, feedback`; update `intensity, plan, feedback`. The app writes with insert … on conflict do nothing, and a replan with an update.

## Engine rules

- **Due weeks** (`weeksDue`): this week always; from Sunday 18:00 also the next one.
- **Rotation**: the program's days with exercises, from the day after the last workout's day name, one per training weekday.
- **Target** (`nextTarget`), from the latest logged sets of the exercise (name match without case or Turkish letters); working weight = heaviest set:
  - never logged → program target (`new`)
  - every planned set at the top of the range → the catalogue step of the exercise (`workout/exercises.ts`), else +1 kg (< 20 kg) or +2,5 kg; reps back to the bottom (`up_kg`)
  - inside the range → same kg, +1 rep (`up_reps`)
  - below the range, a light week, 0 kg at the top, or text reps → same (`hold`)
  - deload → kg × 0,9 rounded to 0,5, one set fewer, bottom reps (`deload`)
- **Intensity** (`weekIntensity`): deload after 5 weeks without one, or when ≥ 40 % of tracked exercises (at least 2) stall, never twice in a row; light when last week's completion < 50 %; else normal.
- **Stall**: the newest best estimated 1RM (Epley) is not above the one three workouts earlier.
- **Feedback** (`reviewWeek`): done vs planned; volume Σ kg × reps vs the week before (within ±5 % reads "aynı seviyede"); records (best e1RM above every earlier workout); stalls; sets per muscle group of catalogue exercises (`muscleSets`, optional so older stored weeks parse).
- **Exercise catalogue** (`workout/exercises.ts`, T007): 78 exercises, English name + Turkish aliases (matched without case or Turkish letters), muscle group, weight step (5 kg heavy lower body, 2,5 kg barbell/machine, 2 kg dumbbell press/row, 1 kg isolation and bodyweight). Code data, no table: programs and logs keep free-text names.
