# Calorie Tracker

Turkish, mobile-first web app for logging meals: photo, barcode, food search and a free-text quick
bar ("Öğlen 200g ızgara tavuk, bol salata"), with a formula-based nutrition plan, plan periods,
weight, water, intermittent fasting and progress trends.

## Getting started

The Next.js app is gone; the product is being rebuilt as an Expo app on Supabase
(`specs/001-mobile-foundation/`). Setup and validation: [quickstart.md](specs/001-mobile-foundation/quickstart.md).

```bash
npm install          # all workspaces: apps/mobile, packages/core, supabase, tools/preview
npm run mobile       # Metro for the development build
npm test             # @calorie/core unit and property tests
npm run typecheck && npm run lint && npm run knip
```

Database migrations and pgTAP tests: [supabase/README.md](supabase/README.md).

## Where things are written down

- **Scope and rules:** `.specify/memory/constitution.md` (Spec Kit). New features start with
  `/speckit-specify` and live in `specs/`.
- **Architecture, flows and conventions:** `CLAUDE.md`.
- **Design system:** `tofuhq-design/` and the tokens in `src/app/globals.css`.
