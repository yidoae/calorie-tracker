# Contract: Evaluation tool (`tools/aieval`)

A workspace that is never shipped. Commands run from the repository root.

| Command | Needs | Writes | Fails when |
|---|---|---|---|
| `npm run eval:text -w aieval` | nothing (no network) | `tools/aieval/out/text.md` | a case file is invalid; the preview finds the expected foods and grams for < 90 % of phrases with an amount (SC-003); runs in CI |
| `npm run eval -w aieval -- --model <id>` | `GEMINI_API_KEY` in the environment | `tools/aieval/out/<model>.md` | a case file is invalid or a food id is unknown; never on low scores (the report is the result) |

The model report lists, per photo and in total: foods found / expected (SC-001 recall), foods
proposed that are not on the plate (false positives), median and per-food weight error (SC-002),
latency p50 / p90, input and output tokens and cost per call at the paid price. Phrase results
are reported the same way for the AI path (SC-003 AI part).

The prompt builder and response schema are imported from the function's shared module
(`supabase/functions/_shared/ai/`), so the evaluation scores exactly what users get.
