@AGENTS.md

# Calorie Tracker

Mobile-first web app that logs meals from food photos. The user snaps or uploads a photo, a Claude vision model extracts name/calories/macros, and the dashboard shows daily progress bars plus a timeline of today's meals. Desktop is a 3-column layout (calendar · camera/progress/meals · profile & calculator); on phones the columns become tabs.

**Stack:** Next.js (App Router, TypeScript) · Tailwind CSS v4 · Lucide icons · Prisma 6 + SQLite · Anthropic SDK (Claude vision).

> Next.js here is a newer version than most training data. Before changing framework-level code, read the matching guide in `node_modules/next/dist/docs/` (see AGENTS.md).

## Getting started

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env        # DATABASE_URL, plus ANTHROPIC_API_KEY for real food recognition
npm run db:migrate          # creates prisma/dev.db and applies migrations
npm run dev                 # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (route types like `RouteContext` are generated, so plain `tsc` fails on a clean checkout) |
| `npm run db:migrate` | `prisma migrate dev` — create/apply migrations after editing `schema.prisma` |
| `npm run db:deploy` | `prisma migrate deploy` — apply existing migrations (production) |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:reset` | Drop and recreate the dev database |

## Project structure

```
prisma/
  schema.prisma            Meal model (id, name, calories, protein, carbs, fat, imageUrl, createdAt)
  migrations/              Committed migration history
  dev.db                   Local SQLite file (gitignored)
uploads/                   Stored meal photos (gitignored, created on first upload)
src/
  app/
    layout.tsx, page.tsx   Shell + home page (renders <Dashboard />)
    globals.css            Tailwind import, light/dark theme variables
    api/
      meals/route.ts       GET  list meals in a date range · POST  upload photo -> analyze -> save
      meals/[id]/route.ts  DELETE a meal (and its photo)
      uploads/[filename]/route.ts  GET  serves stored photos
  components/
    Dashboard.tsx          Client component: 3-column layout (tabs below `lg`), loads today's meals, owns state, picks targets
    MealUploader.tsx       "Snap a meal" (inline live camera panel) + "Upload" buttons; POSTs FormData; shows no-food warning
    CameraCapture.tsx      getUserMedia video preview + reticle; "Capture & Analyze" grabs a frame via canvas
    ProfilePanel.tsx       Gender/height/weight/age/activity form (right column); Save persists the profile
    ProfileResults.tsx     BMI + WHO category badge/gauge, BMR/TDEE, suggested calories/protein/carbs/fat
    MealCalendar.tsx       Month grid (native, Monday-first, left column); selecting a day shows <DayDetail /> under it
    DayDetail.tsx          One day's totals vs targets + mini meal list with thumbnails
    MacroProgress.tsx      Accessible progress bar for one macro; turns red when over goal
    MealTimeline.tsx       List of meals (photo, time, macros, delete)
    MealThumb.tsx          Square meal photo with fallback icon
  lib/
    vision.ts              Vision AI handler: Claude call (or offline mock without a key), NoFoodError, output validation
    food/                  The offline mock's internals: imageFeatures.ts (sharp -> colour/texture stats),
                           recognize.ts (not-food guard + dish match/portion), catalog.ts (ingredients per 100 g, dishes)
    storage.ts             Save/read/delete uploaded images on disk; filename validation
    goals.ts               DAILY_GOALS fallback, MacroKey/Macros, sumMacros
    profile.ts             Profile type, BMI + WHO categories, Mifflin-St Jeor BMR/TDEE, calculateTargets, validation
    useProfile.ts          Profile persisted in localStorage via useSyncExternalStore
    useIsClient.ts         false on server/hydration, true after (avoids date/locale hydration mismatches)
    dates.ts               Local-timezone day keys and month grid helpers
    db.ts                  Prisma client singleton
    types.ts               MealDTO shared between API and client
```

## How it works

1. `MealUploader` POSTs the photo as multipart `image` to `/api/meals`. The photo comes from the live camera sheet (`CameraCapture`, JPEG from a canvas frame) or the file picker.
2. The route validates type (JPEG/PNG/WebP/GIF) and size (10 MB), calls `analyzeFoodImage()`, saves the file to `uploads/`, and inserts a `Meal`. It returns the new meal (201). If the photo isn't food, `analyzeFoodImage()` throws `NoFoodError` and the route answers 422 "No food detected in image. Please show a valid meal." — nothing is saved.
3. `Dashboard` prepends it to state; totals and progress bars recompute client-side.
4. On load, `Dashboard` calls `GET /api/meals?from=&to=` with the **browser's** local-day boundaries, so "today" follows the user's timezone rather than the server's.
5. `MealCalendar` uses the same endpoint for the visible month and groups meals by local day client-side; the selected day (today by default) is summarised under the grid. `Dashboard` bumps `refreshKey` after add/delete so the calendar refetches.

## Conventions and gotchas

- **Vision AI is Claude, with an offline mock fallback.** When `ANTHROPIC_API_KEY` is set, `analyzeFoodImage()` in `src/lib/vision.ts` downsizes the photo to a ≤1568 px JPEG with `sharp`, sends it to `ANTHROPIC_MODEL` (default `claude-opus-5`) with a JSON-schema structured output (`is_food`, `not_food_reason`, `name`, `calories`, `protein`, `carbs`, `fat`), throws `NoFoodError` when `is_food` is false, and passes the rest through `normalize()`. It opts into server-side refusal fallbacks (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`) and treats a remaining refusal as a 502. Without a key it uses the old heuristic mock (`food/`: colour/texture stats, not-food guard in `GUARD` in `food/recognize.ts`, dish catalog) so dev works offline; that mock is not a classifier and is easily fooled. Never commit the key — `.env*` is gitignored.
- **Photos are not in `public/`.** Files added to `public/` after build aren't reliably served in production, so photos go to `uploads/` and are served by `/api/uploads/[filename]`. Filenames must be server-generated UUIDs (`isValidFilename`) — this also blocks path traversal.
- **Daily targets come from the profile.** `Dashboard` uses `calculateTargets(profile)` (maintenance calories; protein 1.6 g/kg, fat 25% of kcal, carbs the remainder). The profile lives in browser `localStorage` (not the DB), so it is per-device; until it's set, `DAILY_GOALS` in `src/lib/goals.ts` is the fallback.
- **Live camera needs a secure context** (https or localhost). Otherwise `navigator.mediaDevices` is undefined and "Snap a meal" falls back to the hidden `capture` file input, which opens the native camera app on phones.
- **The live camera is inline, not a modal.** `MealUploader` renders `CameraCapture` in a panel under the buttons; unmounting it (close button or capture) is what releases the camera stream.
- **Responsive layout is CSS-only.** `Dashboard` renders all three columns and hides the inactive ones below `lg` with `hidden lg:block`; the tab state only matters on phones. `ProfilePanel` is keyed on the saved profile so it remounts with fresh values when the profile changes.
- **Prisma is pinned to v6.** `prisma@latest` on npm is currently a v8 release candidate; v7+ changes client generation and config, so don't bump without migrating.
- `DATABASE_URL` for SQLite is relative to `prisma/schema.prisma`, so `file:./dev.db` means `prisma/dev.db`.
- Route Handlers receive `params` as a Promise: `const { id } = await ctx.params` (typed via the global `RouteContext<"/route/[param]">`).
