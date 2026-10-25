# Tasks: Weekly Training Plan

## Done (main session, 2026-10-26)

- [x] T001 pgTAP `workout_weeks.test.sql` seen failing; migration applied to dev, version equal to the file name; 11/11
- [x] T002 Core schemas (`weekdays`, week plan, feedback, row) and engine `workout/plan.ts`, `workout/review.ts`; `tests/weeklyPlan.test.ts` 19/19
- [x] T003 Service `getWeeks`/`saveWeek`, program `weekdays`; `useWeeklyPlan`; `plannedSessionDraft` (+ test); preview fake
- [x] T004 Basic UI: `WeekPlanCard` on the Antrenman tab; `/workout/session?date=`

## Open

- [ ] T005 [Art Director] Design pass on the weekly plan card and feedback (intensity badge, change chips, today highlight, empty week); weekday picker in the program editor (`ProgramDraft.weekdays`); "Planı yeniden oluştur" after a program save (`useWeeklyPlan().replan`); preview entries
- [ ] T006 [Art Director] Sunday 19:00 local notification "Haftalık planın hazır" (`npx expo install expo-notifications`; permission asked from the Antrenman tab; cancelled when there is no program)
- [x] T007 [Admin] Exercise catalogue: common exercises with Turkish and English names and aliases, muscle group and weight step; plug the step into `increment` and add volume per muscle group to the feedback (core change with tests)
- [ ] T008 [Tester] Review T001–T007; edge cases (time zone at Sunday 18:00, program with empty days, two devices); simplify
- [ ] T009 On the phone: a Sunday-evening plan appears, a planned day logs, next week's targets move
