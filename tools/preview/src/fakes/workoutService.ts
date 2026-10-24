// Preview stand-in for apps/mobile/src/services/workoutService.ts: the sample user's Push / Pull /
// Legs program and three weeks of workouts, so the Antrenman tab shows weight progress.
import type * as Workouts from "@/services/workoutService";

const wait = () => new Promise((resolve) => setTimeout(resolve, 900));

type Program = NonNullable<Awaited<ReturnType<typeof Workouts.getProgram>>>;
type Session = Awaited<ReturnType<typeof Workouts.logSession>>;

const PROGRAM: Program = {
  name: "PPL 6 gün",
  split: "Push / Pull / Legs",
  days: [
    {
      name: "Push",
      exercises: [
        { name: "Bench press", sets: 4, reps: "6-8", kg: 60 },
        { name: "Shoulder press", sets: 3, reps: "8-10", kg: 30 },
        { name: "Lateral raise", sets: 3, reps: "12-15", kg: 8 },
      ],
    },
    { name: "Pull", exercises: [{ name: "Lat pulldown", sets: 4, reps: "8-10", kg: 50 }, { name: "Barbell row", sets: 4, reps: "6-8", kg: 50 }] },
    { name: "Legs", exercises: [{ name: "Squat", sets: 4, reps: "5-8", kg: 80 }, { name: "Leg curl", sets: 3, reps: "10-12", kg: null }] },
  ],
};

const push = (date: string, bench: number): Session => ({
  id: `00000000-0000-4000-8000-0000000007${date.slice(-2)}`,
  performedOn: date,
  dayName: "Push",
  createdAt: `${date}T18:00:00Z`,
  exercises: [
    { name: "Bench press", sets: [{ kg: bench, reps: 8 }, { kg: bench, reps: 7 }, { kg: bench + 2.5, reps: 6 }, { kg: bench + 2.5, reps: 5 }] },
    { name: "Shoulder press", sets: [{ kg: 30, reps: 10 }, { kg: 30, reps: 9 }, { kg: 30, reps: 8 }] },
  ],
});
const SESSIONS: Session[] = [
  push("2026-10-23", 65),
  {
    id: "00000000-0000-4000-8000-000000000722",
    performedOn: "2026-10-22",
    dayName: "Legs",
    createdAt: "2026-10-22T18:00:00Z",
    exercises: [{ name: "Squat", sets: [{ kg: 85, reps: 6 }, { kg: 85, reps: 6 }, { kg: 90, reps: 5 }] }],
  },
  push("2026-10-17", 62.5),
  push("2026-10-10", 60),
  push("2026-10-03", 57.5),
];

export async function getProgram(): ReturnType<typeof Workouts.getProgram> {
  return PROGRAM;
}

export async function saveProgram(program: Program): ReturnType<typeof Workouts.saveProgram> {
  await wait();
  return program;
}

export async function getSessions(): ReturnType<typeof Workouts.getSessions> {
  return SESSIONS;
}

export async function logSession(session: Parameters<typeof Workouts.logSession>[0]): ReturnType<typeof Workouts.logSession> {
  await wait();
  return { ...session, id: "00000000-0000-4000-8000-0000000007ff", createdAt: new Date().toISOString() };
}

export async function deleteSession(..._args: Parameters<typeof Workouts.deleteSession>): ReturnType<typeof Workouts.deleteSession> {
  await wait();
}
