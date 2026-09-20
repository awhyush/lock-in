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
2. **Onboarding**: pick a plan — Light, Standard, Ambitious, or Custom (set your own minutes per habit) — which decides every habit's target (`src/lib/habits.ts`). Changeable anytime from `/settings`.
3. **Dashboard**: greets you by name, shows today's habits against that day's weekday rules, a running streak (computed over a real 60-day window under the hood, not just what's on screen), and a history strip you can widen to 14/30/90 days. Every tap writes straight to your account via `POST /api/checkin`.

## Deploying (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this GitHub repo.
2. In the project's **Storage** tab, **Create Database → Neon (Postgres)**, connecting it to at least Production. Vercel provisions it and auto-injects a batch of env vars, including `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) — these two are what `prisma/schema.prisma` reads. If a future integration version names the unpooled one differently, update `directUrl = env("...")` in the schema to match rather than renaming the var.
3. Add the rest of the environment variables (Settings → Environment Variables):
   - `AUTH_SECRET` — generate a fresh one, don't reuse your local `.env`'s value: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `NEXT_PUBLIC_SITE_URL` — your Vercel deployment URL (e.g. `https://lock-in.vercel.app`); you can add this after the first deploy once you know the URL, then redeploy
4. Deploy. `npm run build` runs `prisma migrate deploy` before building (see `package.json`) — Vercel never actually invokes `npm start` for serverless deploys, so migrations have to happen at build time instead. The schema is created/updated automatically on every deploy; no manual migration step needed.

## Structure

- `src/lib/habits.ts` — habit/intensity/weekday config and the streak logic, shared by the server and the client.
- `src/auth.ts` — NextAuth config (Credentials provider, JWT sessions).
- `src/app/api/*` — signup, onboarding, check-in, and history (widening the strip beyond what loaded server-side) endpoints.
- `src/app/{login,signup,onboarding,dashboard}` — the pages.
- `src/components/Tracker.tsx` — the dashboard's interactive UI.
- `prisma/schema.prisma` — `User` and `CheckIn` models.

## Origin

`legacy-artifact/` holds the original single-file version of this tracker — a static HTML page published as a Claude artifact, synced via Claude's `db` capability instead of a real account system. Kept for reference; the Next.js app above is the one to use going forward.
