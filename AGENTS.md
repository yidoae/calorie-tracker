# Agent notes

The app is an Expo (SDK 57) project in `apps/mobile`; read `apps/mobile/AGENTS.md` before touching
Expo, EAS or React Native APIs, and install packages with `npx expo install`. Project rules:
`.specify/memory/constitution.md`; project guide: `CLAUDE.md`.

## Working next to Claude (Antigravity and other tools)

Claude Code and its agents work in this repo at the same time. Follow the "Agent rules" in
`CLAUDE.md` and `.claude/verification.md` like they do:

- Own worktree and branch; commit prefix `antigravity:`. Never push `master`, never force push.
- When done, push `review/antigravity/<slug>` and add your line to
  `C:\Users\yigit\Documents\calorie-tracker\.claude\agent-status\queue.md`; Claude's `/verify` has
  Tester (and Security for sensitive paths) review it before it lands on master.
- Before you start, read `queue.md` and the status files in that folder (`main.md` is Claude's
  main session) so you do not take work someone is doing. Keep your own in `antigravity.md` there,
  with a `## Claude'a` section for questions and handoffs; Claude answers in `main.md` under
  `## Antigravity'ye`.
- Migrations, Edge Function deploys and secrets reach dev only after merge (§4).
