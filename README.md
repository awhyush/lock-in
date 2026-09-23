# The Lock-In

A habit tracker for a personal reset: accounts, per-user intensity ("how much are you actually investing right now"), a personalized daily plan, and a streak view with a 14/30/90-day filter.

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

1. **Sign up** with name, email, password (hashed with bcrypt, stored in Postgres via Prisma). Already signed in? Change your password anytime from `/profile`, which requires your current password — see [Password reset & change](#password-reset--change) below.
2. **Onboarding**: pick a plan — Light, Standard, Ambitious, or Custom — which decides every habit's target (`src/lib/habits.ts`). **Custom** is different from the other three: instead of retargeting the same 5 fixed habits, you define your own goals (at least one, as many as you want), each with its own tracking type — see [Custom goal types](#custom-goal-types) below. Changeable anytime from `/settings`.
3. **Dashboard**: greets you by name, shows today's habits/goals, a running streak (computed over a real 60-day window under the hood, not just what's on screen), and a history strip you can widen to 14/30/90 days — one row per habit (preset plans, `src/components/Tracker.tsx`) or per goal (custom plans, `src/components/GoalTracker.tsx`). Preset plans also get weekday rules (Friday's lighter, Saturday's just exercise, Sunday's recovery); custom goals are required every day, no variation. Every tap writes straight to your account via `POST /api/checkin` or `POST /api/goal-entries`.
4. **Circles**: invite friends via a shareable code, see each other's last-14-day grid (done/not-done only — never exact counts), sorted by streak or this-week %, with a quiet "still to go today" nudge. A circle happily mixes preset- and custom-plan members — each renders their own row set. Each member also controls, per circle, which of their own habits/goals are visible there — see [Per-circle visibility](#per-circle-visibility) below. In the last 2 hours of the day, members who haven't finished can be nudged — see [Nudges](#nudges) below.

## Custom goal types

Each custom goal has one of three types (`src/lib/goals.ts`), chosen when it's created in `PlanForm.tsx` and fixed after that (edit by removing and re-adding):

- **Checkbox** — plain done/not-done, no target. The original (and still default) behavior.
- **Duration** — a target in minutes, still tracked as a done/not-done toggle; the target is shown as a reminder ("30 min minimum") but doesn't change what counts as done. Mirrors the fixed preset habits (exercise/study/etc.), which work the same way.
- **Counter** — a target "aim for N" count, tracked as an actual running number via a +/- stepper. Counts as done the moment the count is at least 1 (the target is a motivational display, not the completion threshold) — mirrors the "Work" (apply) preset habit.

`POST /api/goal-entries` decides which field is valid — `done` or `count` — from the goal's *actual* stored type, never from whatever shape the client happens to send, so a checkbox goal can't be fed an arbitrary count or vice versa.

## Per-circle visibility

Every circle membership (`CircleMember.visibleKeys`, a JSON array of habit-keys/goal-ids) can independently restrict which of that member's own habits/goals are shown in *that* circle. Null (the default) means "show everything" — nobody's existing circles change until they narrow something. Editable from the circle page's "What you share here" panel, saved via `PATCH /api/circles/[id]/visibility`, which is scoped to `session.user.id` + the circle id from the URL — it can only ever update the caller's own membership row.

The restriction isn't just cosmetic: `getCircleForMember` (`src/lib/circles.ts`) computes streak, week %, and "done today" from the *filtered* subset too, not the member's true full plan — otherwise those aggregate numbers would quietly leak whether a hidden habit was done. For preset-plan members this threads an optional `restrictToKeys` through `dayComplete`/`computeStreak`/`computeWeekCompletion` (`src/lib/habits.ts`, opt-in — every other caller is unaffected); for custom-plan members it's just a filtered `GoalDef[]` passed into the same `goals.ts` functions everyone else uses, since those already take an explicit goal list. Two different circles can show a completely different subset of one person's habits — visibility is per (user, circle), not a single global setting.

## Nudges

Any circle member can send another member a "you're about to lose your streak" nudge (`src/components/CircleView.tsx`, the button on their row) — but only when both are true, checked server-side in `POST /api/circles/[id]/nudge`, never trusted from the client:

- **Under 2 hours left in the day.** `isNudgeWindowOpen` (`src/lib/nudges.ts`) compares the current time against the next local midnight — same clock every other date computation in this app uses. It's a pure function, unit-testable without touching the system clock.
- **The recipient hasn't finished today.** Reuses `getCircleForMember`'s already-computed, visibility-filtered `doneToday` for that member in that circle, rather than re-deriving streak logic in the route.

One nudge per (circle, sender, recipient) per day — enforced both by an app-level check and, as a backstop, a DB unique constraint on `Nudge`. There's no push/email notification system in this app, so delivery is in-app only: the recipient's next dashboard load fetches their unseen nudges, shows a dismissible banner naming who nudged them and in which circle, and marks them seen in that same request — so it surfaces once, not on every subsequent visit.

## Password reset & change

- **Change password** (`/profile`, logged in — active): `POST /api/account/change-password` always operates on `session.user.id` from the server-side session — never a client-supplied id — and requires the current password to verify before setting a new one. This is the only password-change path right now.
- **Forgot password** (`/forgot-password`, logged out — disabled): fully built (`src/components/ForgotPasswordForm.tsx` / `ResetPasswordForm.tsx`, `POST /api/auth/forgot-password` / `reset-password`) but switched off — both routes early-return behind a `const DISABLED = true` guard, and the pages just redirect to `/login`. Reason: Resend's free tier without a verified sending domain can only deliver to the account's own signup email, not real users. Flip `DISABLED` to `false` in both route files, add `RESEND_FROM_EMAIL` on a verified domain, and restore the "Forgot password?" link in `LoginForm.tsx` (currently commented out) to bring it back. Until then: a random 256-bit token would be generated per request, only its SHA-256 hash stored (`PasswordResetToken`), single-use, 30-minute expiry, always-identical response whether or not the email exists (no account enumeration), rate-limited by both IP and target email — nothing about the design needs to change when it's re-enabled.

Email delivery goes through [Resend](https://resend.com) (`src/lib/email.ts`) if `RESEND_API_KEY` is set; otherwise the reset link is just logged to the server console. Moot while forgot-password is disabled, but wired up and tested for whenever it's switched back on.

## Deploying (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this GitHub repo.
2. In the project's **Storage** tab, **Create Database → Neon (Postgres)**, connecting it to at least Production. Vercel provisions it and auto-injects a batch of env vars, including `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) — these two are what `prisma/schema.prisma` reads. If a future integration version names the unpooled one differently, update `directUrl = env("...")` in the schema to match rather than renaming the var.
3. Add the rest of the environment variables (Settings → Environment Variables):
   - `AUTH_SECRET` — generate a fresh one, don't reuse your local `.env`'s value: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `NEXT_PUBLIC_SITE_URL` — your Vercel deployment URL (e.g. `https://lock-in.vercel.app`); you can add this after the first deploy once you know the URL, then redeploy. It's also what the reset-password link points at, so forgot-password won't produce a usable link until this is set.
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — optional, but without them forgot-password can't actually deliver an email in production (it'll only log the link server-side, which nobody but you can see). Get a key at [resend.com](https://resend.com).
4. Deploy. `npm run build` runs `prisma migrate deploy` before building (see `package.json`) — Vercel never actually invokes `npm start` for serverless deploys, so migrations have to happen at build time instead. The schema is created/updated automatically on every deploy; no manual migration step needed.

## Structure

- `src/lib/habits.ts` — the fixed 5-habit/weekday config and streak logic (preset plans), shared by server and client.
- `src/lib/goals.ts` — the parallel, day-agnostic streak logic for custom-plan user-defined goals, including the checkbox/duration/counter type system.
- `src/lib/circles.ts` — loads a circle's detail for a viewer, resolving each member's rows/streak from either `habits.ts` or `goals.ts` depending on *their* plan, filtered through that member's per-circle visibility choice.
- `src/auth.ts` — NextAuth config (Credentials provider, JWT sessions).
- `src/app/api/*` — signup, onboarding (also reconciles a custom plan's goal set), check-in/goal-entries, history/goal-history, circles (including per-circle visibility), and forgot/reset/change-password endpoints.
- `src/app/{login,signup,forgot-password,reset-password,onboarding,dashboard,settings,profile,circles}` — the pages.
- `src/components/{Tracker,GoalTracker}.tsx` — the dashboard's interactive UI for preset vs. custom plans; both render `HabitGrid.tsx`, the shared sticky-column day grid also used by `CircleView.tsx`.
- `src/components/AppNav.tsx` — the fixed floating bottom nav (Circles/Settings, theme/sign-out, and a center Dashboard FAB) shown on every authenticated page.
- `src/app/globals.css` — the design tokens (Charcoal/Red/Sage palette, Nunito, card/nested radii, soft shadow) that drive the whole UI.
- `src/lib/nudges.ts` — the pure time-gate (`isNudgeWindowOpen`) behind the circle nudge feature.
- `prisma/schema.prisma` — `User`, `CheckIn` (preset habits), `Goal`/`GoalEntry` (custom goals), `Circle`/`CircleMember`, `Nudge`, `RateLimitHit`, `PasswordResetToken`.

## Origin

`legacy-artifact/` holds the original single-file version of this tracker — a static HTML page published as a Claude artifact, synced via Claude's `db` capability instead of a real account system. Kept for reference; the Next.js app above is the one to use going forward.
