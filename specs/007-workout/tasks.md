# Tasks: Workout Program and Weight Progress

**Input**: [spec.md](./spec.md), [data-model.md](./data-model.md). Small feature; plan and research are folded into these two files.

## Phase 1: Database
- [x] T001 pgTAP `supabase/tests/database/workouts.test.sql` written first and seen failing (2/2 failed before the migration)
- [x] T002 Migration `20261025000100_workouts.sql` applied to dev, version equal to the file name; test 17/17; security advisor shows nothing new
- [x] T003 `packages/core/src/db/database.types.ts` regenerated

## Phase 2: Core and logic
- [x] T004 `packages/core/src/schemas/workout.ts` + `tests/workout.test.ts`
- [x] T005 `apps/mobile/src/hooks/workoutLogic.ts` (templates, editor and logger validation, progress) + `tests/workoutLogic.test.ts` (11 tests)

## Phase 3: App
- [x] T006 `services/workoutService.ts`; hooks `useWorkout.ts`, `useProgramEditor.ts`, `useWorkoutLogger.ts`
- [x] T007 [US1] `components/workout/ProgramEditorScreen.tsx`, route `app/workout/program.tsx`
- [x] T008 [US2] `components/workout/WorkoutSessionScreen.tsx`, route `app/workout/session.tsx`
- [x] T009 [US3] `components/workout/ExerciseProgressScreen.tsx` + `ProgressChart.tsx`, route `app/workout/exercise.tsx`
- [x] T010 Antrenman tab `app/(tabs)/workout.tsx` (`WorkoutOverview.tsx`); routes registered in the root layout's `ready` guard
- [x] T011 Preview fake `tools/preview/src/fakes/workoutService.ts` and four gallery entries

## Phase 4: Validation
- [x] T012 `npm test && npm run typecheck && npm run lint && npm run knip`, Android export, `npm run preview` green
- [ ] T013 On the phone (Expo Go, dev): create a program from a template, edit a day, log two workouts of the same day (second one prefilled from the first), open an exercise's progress, delete a workout
