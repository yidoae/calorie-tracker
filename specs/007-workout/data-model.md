# Data Model: Workout Program and Weight Progress

Migration `supabase/migrations/20261025000100_workouts.sql`; tests `supabase/tests/database/workouts.test.sql`; schemas `packages/core/src/schemas/workout.ts`.

## workout_programs (one row per user)

| Column | Type | Rule |
|---|---|---|
| user_id | uuid PK → profiles | default `auth.uid()`; not writable by the client |
| name | text | 1–60 chars |
| split | text | 1–40 chars, the user's label ("Push / Pull / Legs") |
| days | jsonb | array of 1–7 `{ name, exercises: [{ name, sets, reps, kg \| null }] }`, ≤ 32 kB |

Written with an upsert on `user_id`. RLS: read, insert and update own row. Grants: select; insert and update of `name, split, days`.

## workout_sessions (one row per logged workout)

| Column | Type | Rule |
|---|---|---|
| id | uuid PK | |
| user_id | uuid → profiles | default `auth.uid()`; not writable by the client |
| performed_on | date | the user's local date |
| day_name | text | 1–40 chars, copied from the program day |
| exercises | jsonb | array of 1–30 `{ name, sets: [{ kg, reps }] }`, ≤ 32 kB |
| created_at | timestamptz | default now() |

Index `(user_id, performed_on desc)`. RLS: read, insert and delete own rows. Grants: select, delete; insert of `performed_on, day_name, exercises`.

The jsonb shapes are checked by Zod in the app (`workoutProgramSchema`, `workoutSessionRowSchema`); the database checks only the array type, length and size, since a malformed row can only be the owner's own.

## Derived (app, `hooks/workoutLogic.ts`)

- Per exercise (matched by `normalizeTr(name)`): entries oldest first with the top set (heaviest kg, more reps on a tie), Epley e1RM `kg × (1 + reps/30)` (a single is the lift), volume `Σ kg × reps`; best kg and best e1RM.
- Logger prefill: the latest sets of the same exercise, else the program's sets × first number of the reps text at the target kg.
