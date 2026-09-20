# The Lock-In

A habit tracker for a gym / study / job-search reset: accounts, per-user intensity ("how much are you actually investing right now"), a personalized daily plan, and a 14-day streak view.

Built with Next.js (App Router), Prisma + Postgres, and NextAuth (Credentials).

## Running it

Needs a Postgres database — [neon.tech](https://neon.tech) has a free tier and is a one-click integration from Vercel's dashboard if you'd rather create it there.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npx prisma migrate dev   # first time only, creates the schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Sign up** with name, email, password (hashed with bcrypt, stored in Postgres via Prisma).
2. **Onboarding**: pick a plan — Light, Standard, Ambitious, or Custom (set your own minutes per habit) — which decides every habit's target (`src/lib/habits.ts`). Changeable anytime from `/settings`.
3. **Dashboard**: greets you by name, shows today's habits against that day's weekday rules (e.g. Tuesday's football night counts as movement, no study expected), a running streak, and a 14-day history strip. Every tap writes straight to your account via `POST /api/checkin`.

## Deploying (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this GitHub repo.
2. In the project's **Storage** tab, **Create Database → Neon (Postgres)**. Vercel provisions it and auto-injects `DATABASE_URL`/`DIRECT_URL` (or similarly named vars — check they match what `prisma/schema.prisma` reads; rename in Project Settings → Environment Variables if not) into the project's environment variables.
3. Add the rest of the environment variables (Settings → Environment Variables):
   - `AUTH_SECRET` — generate a fresh one, don't reuse your local `.env`'s value: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `NEXT_PUBLIC_SITE_URL` — your Vercel deployment URL (e.g. `https://lock-in.vercel.app`); you can add this after the first deploy once you know the URL, then redeploy
4. Deploy. `npm run build` runs `prisma migrate deploy` before building (see `package.json`) — Vercel never actually invokes `npm start` for serverless deploys, so migrations have to happen at build time instead. The schema is created/updated automatically on every deploy; no manual migration step needed.

## Structure

- `src/lib/habits.ts` — habit/intensity/weekday config and the streak logic, shared by the server and the client.
- `src/auth.ts` — NextAuth config (Credentials provider, JWT sessions).
- `src/app/api/*` — signup, onboarding, and check-in endpoints.
- `src/app/{login,signup,onboarding,dashboard}` — the pages.
- `src/components/Tracker.tsx` — the dashboard's interactive UI.
- `prisma/schema.prisma` — `User` and `CheckIn` models.

## Origin

`legacy-artifact/` holds the original single-file version of this tracker — a static HTML page published as a Claude artifact, synced via Claude's `db` capability instead of a real account system. Kept for reference; the Next.js app above is the one to use going forward.
