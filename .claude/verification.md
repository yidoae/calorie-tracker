# Verification loop

No agent merges its own code. Every change reaches `master` only after an independent agent has
read it and run the checks itself at the same sha. The `/verify` skill (main session) drives the
loop; subagents cannot start each other.

## 1. Author

1. Work in your own worktree/branch. Run your own checks (your agent file) and keep them green.
2. Rebase on `origin/master`, then push a review branch instead of master:
   `git push origin HEAD:refs/heads/review/<agent>/<slug>` (force-push only this branch of yours,
   only while it is under review).
3. Append one line to `C:\Users\yigit\Documents\calorie-tracker\.claude\agent-status\queue.md`:
   `- [ ] review/<agent>/<slug> @<sha> — <one line, Turkish> — checks: <what you ran>`
4. Stop. On `DÜZELT` you get the findings on the same branch: fix, push, update the sha in the line.

**Exempt** (straight to master as before): changes that touch only Markdown under `specs/`, and
status files (outside the repo anyway). Anything else, including `CLAUDE.md`, agent files,
config, tests, generated files and migrations, goes through review.

## 2. Reviewers (from the changed paths)

| Changed | Reviewer |
|---|---|
| any code, test, config or generated file | **Tester** (Security when Tester is the author) |
| `supabase/migrations/`, `supabase/functions/`, `supabase/config.toml`, `apps/mobile/src/services/`, auth/session hooks and routes, `app.config.ts`, `eas.json`, `.env*`, any `package.json` or lockfile, `.claude/` | also **Security** (Tester when Security is the author) |
| `components/`, `theme.ts` | also **Art Director** for tofuhq and accessibility (not when it is the author) |

A reviewer never reviews their own commit. Admin's food-data rules are checked by Tester
(`npm run check -w fooddata`, search cases) unless Admin asks for a data reviewer.

## 3. Reviewer

1. Check out the exact sha in your own worktree (`git fetch origin && git checkout --detach <sha>`).
2. Run every check yourself: `npm test`, `npm run typecheck`, `npm run lint`, `npm run knip`, plus
   what the paths need (`check -w fooddata`, `eval:text -w aieval`, `test:functions`, pgTAP against
   dev for migrations, `npm run preview` for screens). Never trust the author's "checks:" line.
3. Read the change and the code it connects to: correctness, tests for new branches, the
   constitution, your own area (Security: section "Audit" of `security.md`).
4. Answer with exactly this block (the main session parses it):

```
VERDICT: ONAY | DÜZELT
BRANCH: review/<agent>/<slug> @<sha>
CHECKS: <command → result, one per line>
FINDINGS:
- [Kritik|Yüksek|Orta|Düşük] <file:line> — <what is wrong> — <how to fix>
```

`DÜZELT` only for findings that must change before merge (any Kritik/Yüksek, wrong behaviour, a
red check, a missing test for a new branch). Orta/Düşük alone → `ONAY`, findings go to follow-ups.
Approving a sha means that sha; a new push needs a new review.

## 4. Merge (main session, `/verify`)

- All reviewers `ONAY` on the same sha → rebase on `origin/master`. If the rebase is clean and only
  `master` moved, rerun `npm test && npm run typecheck`, then `git push origin <sha>:master`, delete
  the review branch, tick the queue line. A conflict goes back to the author.
- Any `DÜZELT` → the author fixes on the branch, then all reviewers review again.
- Three rounds without `ONAY`, or any Kritik → `engellendi` for the owner, with the findings.
- Orta/Düşük follow-ups go to the owning agent's status file under "Sıradaki".
