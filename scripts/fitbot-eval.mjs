// Runs FitBot's evaluation set against the running dev server and prints a pass/fail report.
//   npm run fitbot:eval                 all cases once
//   npm run fitbot:eval -- --runs 3     each case 3 times (answers vary between runs)
//   npm run fitbot:eval -- --only tool  only cases whose id or category contains "tool"
// Writes the full answers to eval-results/<timestamp>.json so runs can be compared.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ask, sampleContext } from "./fitbot-ask.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const runs = Math.max(1, Number(flag("--runs") ?? 1));
const only = flag("--only");

const { cases } = JSON.parse(readFileSync(new URL("./fitbot-eval-cases.json", import.meta.url), "utf8"));
const selected = only ? cases.filter((c) => c.id.includes(only) || c.category.includes(only)) : cases;

// A day long past, so "today" has no meals and results don't depend on what's in the database.
const context = { ...sampleContext(), dayStart: "2000-01-01T00:00:00.000Z", dayEnd: "2000-01-02T00:00:00.000Z" };

function check(testCase, reply) {
  const failures = [];
  for (const re of testCase.mustMatch ?? []) if (!new RegExp(re, "i").test(reply)) failures.push(`missing /${re}/`);
  for (const re of testCase.mustNotMatch ?? []) if (new RegExp(re, "i").test(reply)) failures.push(`unexpected /${re}/`);
  return failures;
}

const results = [];
const started = Date.now();
for (const testCase of selected) {
  let passes = 0;
  const attempts = [];
  for (let r = 0; r < runs; r++) {
    const { status, reply } = await ask(testCase.question, context);
    const failures = status === 200 ? check(testCase, reply) : [`HTTP ${status}`];
    if (failures.length === 0) passes++;
    attempts.push({ status, reply, failures });
  }
  results.push({ ...testCase, passes, runs, attempts });
  const mark = passes === runs ? "PASS" : passes === 0 ? "FAIL" : "FLAKY";
  const last = attempts.at(-1);
  console.log(`${mark.padEnd(5)} ${`${passes}/${runs}`.padEnd(5)} [${testCase.category}] ${testCase.id}`);
  if (passes < runs) console.log(`      ${last.failures.join(", ")} — "${last.reply.replace(/\s+/g, " ").slice(0, 160)}"`);
}

const byCategory = {};
for (const r of results) {
  byCategory[r.category] ??= { passes: 0, total: 0 };
  byCategory[r.category].passes += r.passes;
  byCategory[r.category].total += r.runs;
}
const passed = results.reduce((n, r) => n + r.passes, 0);
const total = results.reduce((n, r) => n + r.runs, 0);
console.log(`\nScore: ${passed}/${total} (${Math.round((passed / total) * 100)}%) in ${((Date.now() - started) / 1000).toFixed(0)}s`);
for (const [category, { passes, total: t }] of Object.entries(byCategory)) console.log(`  ${category.padEnd(10)} ${passes}/${t}`);

mkdirSync(new URL("../eval-results/", import.meta.url), { recursive: true });
const file = new URL(`../eval-results/${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url);
writeFileSync(file, JSON.stringify({ model: process.env.LOCAL_LLM_MODEL ?? "(server default)", runs, passed, total, byCategory, results }, null, 2));
console.log(`\nFull answers: eval-results/${file.pathname.split("/").pop()}`);
