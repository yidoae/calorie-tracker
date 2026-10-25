# Plan: Weekly Training Plan

## Architecture

- `@calorie/core/workout/review`: dates (Monday-first), Epley, history per exercise, stalls, `reviewWeek`.
- `@calorie/core/workout/plan`: `weeksDue`, weekdays, `repRange`, `nextTarget`, `weekIntensity`, `planWeek`.
- `services/workoutService`: `getWeeks`, `saveWeek(plan, replace)`; program reads and writes carry `weekdays`.
- `hooks/useWeeklyPlan`: loads program, workouts and weeks; builds and stores every due week that is missing (once per set of weeks); `replan()` rewrites the due weeks.
- `hooks/workoutLogic.plannedSessionDraft`: a planned day as logger fields.
- UI: `components/workout/WeekPlanCard` on the Antrenman tab ("Gelecek hafta" from Sunday 18:00, "Bu hafta"); `/workout/session?date=` logs a planned day.

## Why no server job yet

Plans are built where the data and the engine already are (the app), so the server needs no copy of the engine and no cron. A user who does not open the app on Sunday gets the plan on the next open; the Sunday 19:00 notification covers the routine. If plans must exist without an open (for a weekly e-mail, say), port `planWeek` to an Edge Function and call it from `pg_cron` on Sundays at 18:00 per time zone.

## Open

See tasks.md: design pass, weekday picker, notification, replan after program edits, exercise catalogue with weight steps and muscle groups, phone validation.
