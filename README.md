# The Lock-In

A habit tracker for a gym / study / job-search reset: accounts, per-user intensity ("how much are you actually investing right now"), a personalized daily plan, and a streak view with a 14/30/90-day filter.

Built with Next.js (App Router), Prisma + Postgres, and NextAuth (Credentials).

## Running it

Needs a Postgres database — [neon.tech](https://neon.tech) has a free tier and is a one-click integration from Vercel's dashboard if you'd rather create it there.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, DATABASE_URL_UNPOOLED, AUTH_SECRET
npx prisma migrate dev   # first time only, creates the schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Sign up** with name, email, password (hashed with bcrypt, stored in Postgres via Prisma).
2. **Onboarding**: pick a plan — Light, Standard, Ambitious, or Custom — which decides every habit's target (`src/lib/habits.ts`). **Custom** is different from the other three: instead of retargeting the same 5 fixed habits, you define your own goals (at least one, as many as you want) — the dashboard tracks exactly those instead. Changeable anytime from `/settings`.
3. **Dashboard**: greets you by name, shows today's habits/goals, a running streak (computed over a real 60-day window under the hood, not just what's on screen), and a history strip you can widen to 14/30/90 days — one row per habit (preset plans, `src/components/Tracker.tsx`) or per goal (custom plans, `src/components/GoalTracker.tsx`). Preset plans also get weekday rules (Friday's lighter, Saturday's just exercise, Sunday's recovery); custom goals are required every day, no variation. Every tap writes straight to your account via `POST /api/checkin` or `POST /api/goal-entries`.
4. **Circles**: invite friends via a shareable code, see each other's last-14-day grid (done/not-done only — never exact counts or plan details), sorted by streak or this-week %, with a quiet "still to go today" nudge. A circle happily mixes preset- and custom-plan members — each renders their own row set.

## Deploying (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this GitHub repo.
2. In the project's **Storage** tab, **Create Database → Neon (Postgres)**, connecting it to at least Production. Vercel provisions it and auto-injects a batch of env vars, including `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) — these two are what `prisma/schema.prisma` reads. If a future integration version names the unpooled one differently, update `directUrl = env("...")` in the schema to match rather than renaming the var.
3. Add the rest of the environment variables (Settings → Environment Variables):
   - `AUTH_SECRET` — generate a fresh one, don't reuse your local `.env`'s value: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `NEXT_PUBLIC_SITE_URL` — your Vercel deployment URL (e.g. `https://lock-in.vercel.app`); you can add this after the first deploy once you know the URL, then redeploy
4. Deploy. `npm run build` runs `prisma migrate deploy` before building (see `package.json`) — Vercel never actually invokes `npm start` for serverless deploys, so migrations have to happen at build time instead. The schema is created/updated automatically on every deploy; no manual migration step needed.

## Structure

- `src/lib/habits.ts` — the fixed 5-habit/weekday config and streak logic (preset plans), shared by server and client.
- `src/lib/goals.ts` — the parallel, day-agnostic streak logic for custom-plan user-defined goals.
- `src/lib/circles.ts` — loads a circle's detail for a viewer, resolving each member's rows/streak from either `habits.ts` or `goals.ts` depending on *their* plan.
- `src/auth.ts` — NextAuth config (Credentials provider, JWT sessions).
- `src/app/api/*` — signup, onboarding (also reconciles a custom plan's goal set), check-in/goal-entries, history/goal-history, and circles endpoints.
- `src/app/{login,signup,onboarding,dashboard,settings,circles}` — the pages.
- `src/components/{Tracker,GoalTracker}.tsx` — the dashboard's interactive UI for preset vs. custom plans; both render `HabitGrid.tsx`, the shared sticky-column day grid also used by `CircleView.tsx`.
- `prisma/schema.prisma` — `User`, `CheckIn` (preset habits), `Goal`/`GoalEntry` (custom goals), `Circle`/`CircleMember`, `RateLimitHit`.

## Origin

`legacy-artifact/` holds the original single-file version of this tracker — a static HTML page published as a Claude artifact, synced via Claude's `db` capability instead of a real account system. Kept for reference; the Next.js app above is the one to use going forward.
