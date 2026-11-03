---
name: verify
description: Run the agents' verification loop - reviews every pending review/* branch in the queue with the right reviewer agents (Tester, Security, Art Director), sends DÜZELT findings back to the author, and merges to master only what every reviewer approved at the same sha. Use for "/verify", "review the queue", or with /loop to keep it running.
---

Follow `.claude/verification.md`; it wins over this file. Talk to the owner in Turkish.

1. Read `C:\Users\yigit\Documents\calorie-tracker\.claude\agent-status\queue.md`, `git fetch origin`
   and list `origin/review/*`. A branch without a queue line, or a line whose sha differs from the
   branch tip, gets its line added or corrected. No open lines → say so in one line and stop.
2. For each open line, in queue order: `git diff --name-only origin/master...<sha>`, pick the
   reviewers from the table in `verification.md` §2 (never the author).
3. Start the reviewers in parallel with the Agent tool (`subagent_type` = `tester`, `security`,
   `art-director`), each with: the branch, the sha, the author, the changed files, and "review per
   `.claude/verification.md` §3 and answer with the VERDICT block". Use `isolation: "worktree"`.
4. Read each VERDICT block. A reply without one, or for a different sha, counts as not reviewed:
   ask that reviewer again once.
5. All `ONAY` → merge per §4 and tick the line (`- [x] … — ONAY: <reviewers> — <master sha>`).
   Any `DÜZELT` → start the author agent with the findings and the branch; when it has pushed, go
   back to step 2 for that line. Count rounds in the line (`tur 2/3`); at 3, or on any Kritik, mark
   it `engellendi` and tell the owner.
6. Report: per line, one row: branch, verdict, reviewers, what landed on master or what is blocked.
