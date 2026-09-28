// Ask FitBot one or more questions through the running dev server, with a sample profile as context.
// Usage: node scripts/fitbot-ask.mjs "question 1" "question 2" ...   (server must be on :3000)
const BASE = process.env.FITBOT_BASE_URL || "http://localhost:3000";

export const SAMPLE_PROFILE = {
  id: "sample",
  label: "Sample cut",
  gender: "male",
  heightCm: 180,
  weightKg: 90,
  age: 30,
  activity: "moderate",
  targetWeightKg: 80,
  paceGoal: "moderate",
  trainingType: "strength",
};

export function sampleContext(profile = SAMPLE_PROFILE) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    profile,
    customPlan: null,
    dayStart: start.toISOString(),
    dayEnd: end.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export async function ask(question, context = sampleContext()) {
  const res = await fetch(`${BASE}/api/fitbot/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: question }], context }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, reply: json.reply ?? json.error ?? "" };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("fitbot-ask.mjs")) {
  for (const q of process.argv.slice(2)) {
    const started = Date.now();
    const { status, reply } = await ask(q);
    console.log(`\n> ${q}\n[${status}, ${((Date.now() - started) / 1000).toFixed(1)}s] ${reply}`);
  }
}
