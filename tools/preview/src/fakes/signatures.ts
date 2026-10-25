import type * as RealAi from "@/services/aiService";
import type * as RealAuth from "@/services/authService";
import type * as RealErrors from "@/services/errors";
import type * as RealFood from "@/services/foodService";
import type * as RealMeal from "@/services/mealService";
import type * as RealPlan from "@/services/planService";
import type * as RealProfile from "@/services/profileService";
import type * as RealWorkout from "@/services/workoutService";
import type * as Ai from "./aiService";
import type * as Auth from "./authService";
import type * as Errors from "./errors";
import type * as Food from "./foodService";
import type * as Meal from "./mealService";
import type * as Plan from "./planService";
import type * as Profile from "./profileService";
import type * as Workout from "./workoutService";

/*
 * metro.config.js swaps these fakes in for the app's services, but tsc resolves "@/services/*" to
 * the real ones, so nothing else checks that a fake still fits. Each fake module must be usable
 * wherever the real one is: `npm run typecheck` fails here when a service signature changes.
 */
type Fits<Real, Fake extends Real> = [Real, Fake];

export type FakesFitServices = [
  Fits<typeof RealAi, typeof Ai>,
  Fits<typeof RealAuth, typeof Auth>,
  Fits<typeof RealErrors, typeof Errors>,
  Fits<typeof RealFood, typeof Food>,
  Fits<typeof RealMeal, typeof Meal>,
  Fits<typeof RealPlan, typeof Plan>,
  Fits<typeof RealProfile, typeof Profile>,
  Fits<typeof RealWorkout, typeof Workout>,
];
