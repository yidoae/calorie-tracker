import type { PlanGoal } from "@/types/plan";

/** Goal colours for the period timeline, calendar and list dots. */
export const GOAL_STYLES: Record<PlanGoal, { bar: string; soft: string; dot: string; label: string }> = {
  cut: { bar: "bg-goal-cut", soft: "bg-goal-cut/15", dot: "bg-goal-cut", label: "Kalori açığı" },
  maintain: { bar: "bg-goal-maintain", soft: "bg-goal-maintain/20", dot: "bg-goal-maintain", label: "Denge" },
  bulk: { bar: "bg-goal-bulk", soft: "bg-goal-bulk/20", dot: "bg-goal-bulk", label: "Kalori fazlası" },
};
