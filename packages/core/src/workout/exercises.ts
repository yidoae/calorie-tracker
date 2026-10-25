import { normalizeTr } from "../search/normalize.ts";

/*
 * 008 T007: the common gym exercises, by the English name Turkish gyms use, with Turkish aliases,
 * the muscle group they mostly load and the weight step a plate or pin usually allows. Names match
 * without case or Turkish letters, so "duz bench" finds Bench press. Data only; no table needed,
 * since the program and the logs keep free-text names and this just recognises them.
 */

export const MUSCLE_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "abs"] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Göğüs",
  back: "Sırt",
  shoulders: "Omuz",
  biceps: "Ön kol (biceps)",
  triceps: "Arka kol (triceps)",
  quads: "Bacak (ön)",
  hamstrings: "Bacak (arka)",
  glutes: "Kalça",
  calves: "Baldır",
  abs: "Karın",
};

export interface Exercise {
  name: string;
  aliases: string[];
  muscle: MuscleGroup;
  /** kg added when the top of the rep range is reached. */
  stepKg: number;
}

const e = (name: string, muscle: MuscleGroup, stepKg: number, aliases: string[]): Exercise => ({ name, aliases, muscle, stepKg });

// Steps: 5 kg for heavy lower-body lifts, 2,5 kg for barbells and machines, 2 kg for dumbbell
// presses and rows, 1 kg for isolation dumbbells and cables and for bodyweight work.
export const EXERCISES: readonly Exercise[] = [
  e("Bench press", "chest", 2.5, ["düz bench", "bench", "düz bench press", "barbell bench press"]),
  e("Incline bench press", "chest", 2.5, ["eğik bench", "incline bench", "üst göğüs bench"]),
  e("Decline bench press", "chest", 2.5, ["decline bench", "ters eğik bench"]),
  e("Dumbbell bench press", "chest", 2, ["dumbbell bench", "dambıl bench", "düz dumbbell press"]),
  e("Incline dumbbell press", "chest", 2, ["eğik dumbbell press", "incline dumbbell", "eğik dambıl press"]),
  e("Dumbbell fly", "chest", 1, ["göğüs fly", "dumbbell açış", "dambıl açış"]),
  e("Cable fly", "chest", 1, ["cable crossover", "kablo fly", "crossover"]),
  e("Pec deck", "chest", 2.5, ["pec deck fly", "kelebek", "butterfly"]),
  e("Chest press machine", "chest", 2.5, ["chest press", "makine göğüs press"]),
  e("Push-up", "chest", 1, ["şınav", "push up"]),
  e("Dips", "chest", 1, ["paralel bar", "dip"]),

  e("Deadlift", "back", 5, ["ölü kaldırma", "klasik deadlift"]),
  e("Barbell row", "back", 2.5, ["bent over row", "halter row", "barbell çekiş"]),
  e("Dumbbell row", "back", 2, ["tek kol row", "dambıl row", "one arm row"]),
  e("Lat pulldown", "back", 2.5, ["lat çekiş", "ön çekiş", "lat pull down"]),
  e("Seated cable row", "back", 2.5, ["cable row", "oturarak kablo çekiş", "seated row", "kürek çekiş"]),
  e("Pull-up", "back", 1, ["barfiks", "pull up"]),
  e("Chin-up", "back", 1, ["ters tutuş barfiks", "chin up"]),
  e("T-bar row", "back", 2.5, ["t bar row", "t-bar çekiş"]),
  e("Machine row", "back", 2.5, ["makine row", "chest supported row"]),
  e("Straight arm pulldown", "back", 1, ["düz kol pulldown", "kablo pullover"]),
  e("Pullover", "back", 2, ["dumbbell pullover", "dambıl pullover"]),
  e("Back extension", "back", 1, ["hiperekstansiyon", "bel ekstansiyonu", "hyperextension"]),
  e("Shrug", "back", 2.5, ["omuz silkme", "trapez shrug", "shrugs"]),

  e("Shoulder press", "shoulders", 2.5, ["omuz press", "overhead press", "ohp", "askeri press", "military press"]),
  e("Dumbbell shoulder press", "shoulders", 2, ["dumbbell omuz press", "dambıl omuz press", "oturarak dumbbell press"]),
  e("Arnold press", "shoulders", 2, ["arnold"]),
  e("Machine shoulder press", "shoulders", 2.5, ["makine omuz press"]),
  e("Lateral raise", "shoulders", 1, ["yan açış", "yana açış", "lateral"]),
  e("Cable lateral raise", "shoulders", 1, ["kablo yan açış"]),
  e("Front raise", "shoulders", 1, ["ön açış", "öne kaldırış"]),
  e("Rear delt fly", "shoulders", 1, ["arka omuz açış", "reverse fly", "ters kelebek"]),
  e("Face pull", "shoulders", 1, ["yüze çekiş", "face pull ip"]),
  e("Upright row", "shoulders", 2.5, ["dik çekiş", "çeneye çekiş"]),

  e("Biceps curl", "biceps", 1, ["ön kol curl", "dumbbell curl", "dambıl curl", "pazu curl"]),
  e("Barbell curl", "biceps", 2.5, ["halter curl", "bar curl", "ez bar curl"]),
  e("Hammer curl", "biceps", 1, ["çekiç curl", "hammer"]),
  e("Preacher curl", "biceps", 1, ["scott curl", "scott sehpası", "preacher"]),
  e("Concentration curl", "biceps", 1, ["konsantrasyon curl"]),
  e("Cable curl", "biceps", 1, ["kablo curl", "cable biceps"]),
  e("Incline dumbbell curl", "biceps", 1, ["eğik dumbbell curl", "eğik sehpa curl"]),

  e("Triceps pushdown", "triceps", 1, ["arka kol pushdown", "pushdown", "ip pushdown", "rope pushdown", "kablo triceps"]),
  e("Overhead triceps extension", "triceps", 1, ["baş üstü triceps", "overhead extension", "french press"]),
  e("Skull crusher", "triceps", 2.5, ["lying triceps extension", "alın kırıcı"]),
  e("Close grip bench press", "triceps", 2.5, ["dar tutuş bench", "close grip bench"]),
  e("Triceps kickback", "triceps", 1, ["kickback", "geri itiş"]),
  e("Bench dip", "triceps", 1, ["bench dips", "sehpa dips"]),

  e("Squat", "quads", 5, ["çömelme", "back squat", "barbell squat", "sırt squat"]),
  e("Front squat", "quads", 2.5, ["ön squat"]),
  e("Smith machine squat", "quads", 5, ["smith squat"]),
  e("Leg press", "quads", 5, ["bacak press", "leg press makine"]),
  e("Hack squat", "quads", 5, ["hack squat makine"]),
  e("Leg extension", "quads", 2.5, ["bacak açma", "quadriceps makine", "leg ext"]),
  e("Lunge", "quads", 2, ["lunges", "öne adım", "walking lunge", "yürüyerek lunge"]),
  e("Bulgarian split squat", "quads", 2, ["bulgar squat", "bulgarian squat"]),
  e("Goblet squat", "quads", 2, ["goblet"]),
  e("Step-up", "quads", 2, ["basamak çıkma", "step up"]),

  e("Romanian deadlift", "hamstrings", 2.5, ["rdl", "romen deadlift", "rumen deadlift"]),
  e("Stiff leg deadlift", "hamstrings", 2.5, ["stiff leg", "düz bacak deadlift"]),
  e("Leg curl", "hamstrings", 2.5, ["lying leg curl", "yatarak leg curl", "bacak bükme"]),
  e("Seated leg curl", "hamstrings", 2.5, ["oturarak leg curl"]),
  e("Good morning", "hamstrings", 2.5, ["günaydın egzersizi"]),
  e("Nordic curl", "hamstrings", 1, ["nordic", "nordic hamstring"]),

  e("Hip thrust", "glutes", 5, ["kalça itiş", "barbell hip thrust"]),
  e("Glute bridge", "glutes", 2.5, ["köprü", "kalça köprüsü"]),
  e("Cable kickback", "glutes", 1, ["kalça kickback", "kablo geri tekme"]),
  e("Hip abduction", "glutes", 2.5, ["abductor", "dış bacak makine", "kalça açma"]),
  e("Sumo deadlift", "glutes", 5, ["sumo"]),

  e("Calf raise", "calves", 2.5, ["baldır kaldırma", "ayakta calf raise", "parmak ucu kalkma", "standing calf raise"]),
  e("Seated calf raise", "calves", 2.5, ["oturarak calf raise", "oturarak baldır"]),
  e("Leg press calf raise", "calves", 5, ["leg press baldır"]),

  e("Crunch", "abs", 1, ["mekik"]),
  e("Sit-up", "abs", 1, ["tam mekik", "sit up"]),
  e("Plank", "abs", 1, ["kalas", "plank duruşu"]),
  e("Hanging leg raise", "abs", 1, ["asılı bacak kaldırma", "leg raise"]),
  e("Cable crunch", "abs", 2.5, ["kablo mekik", "diz çökerek crunch"]),
  e("Russian twist", "abs", 1, ["rus twist", "russian"]),
  e("Ab wheel", "abs", 1, ["karın tekerleği", "ab roller", "tekerlek"]),
];

const byKey = new Map(EXERCISES.flatMap((x) => [x.name, ...x.aliases].map((text) => [normalizeTr(text), x] as const)));

/** The catalogue exercise a typed name means, by name or alias, without case or Turkish letters. */
export const findExercise = (name: string): Exercise | undefined => byKey.get(normalizeTr(name));
