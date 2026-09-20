# The Lock-In

A habit tracker for a gym / study / job-search reset: accounts, per-user intensity ("how much are you actually investing right now"), a personalized daily plan, and a 14-day streak view.

Built with Next.js (App Router), Prisma + SQLite, and NextAuth (Credentials).

## Running it

```bash
npm install
npx prisma migrate dev   # first time only, creates prisma/dev.db
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env` first if it's missing (needs `DATABASE_URL` and `AUTH_SECRET`).

## How it works

1. **Sign up** with name, email, password (hashed with bcrypt, stored in SQLite via Prisma).
2. **Onboarding**: pick a plan — Light, Standard, Ambitious, or Custom (set your own minutes per habit) — which decides every habit's target (`src/lib/habits.ts`). Changeable anytime from `/settings`.
3. **Dashboard**: greets you by name, shows today's habits against that day's weekday rules (e.g. Tuesday's football night counts as movement, no study expected), a running streak, and a 14-day history strip. Every tap writes straight to your account via `POST /api/checkin`.

## Deploying (Railway)

The app uses a SQLite file for its database, so it needs a host with a **persistent disk** — Railway works with zero code changes. (Vercel and other serverless hosts wipe the filesystem on every request, so SQLite won't survive there without switching to a hosted Postgres database instead.)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → pick this repo. Railway auto-detects Next.js and builds it.
2. Add a **Volume** to the service (Settings → Volumes), mounted at `/data`. This is where the SQLite file will live so it survives redeploys and restarts.
3. Set these environment variables on the service (Settings → Variables):
   - `DATABASE_URL` = `file:/data/prod.db` — inside the mounted volume, *not* `./dev.db`
   - `AUTH_SECRET` — generate a fresh one, don't reuse your local `.env`'s value: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `NEXT_PUBLIC_SITE_URL` — the domain from step 4 below (you can leave this blank for the very first deploy and fill it in after)
4. Once deployed, go to Settings → Networking → **Generate Domain** to get a public URL. Paste that into `NEXT_PUBLIC_SITE_URL` and redeploy so Open Graph/canonical links point at the right place.
5. `npm start` already runs `prisma migrate deploy` before starting the server (see `package.json`), so the database schema is created/updated automatically on every deploy — no manual migration step needed.

## Structure

- `src/lib/habits.ts` — habit/intensity/weekday config and the streak logic, shared by the server and the client.
- `src/auth.ts` — NextAuth config (Credentials provider, JWT sessions).
- `src/app/api/*` — signup, onboarding, and check-in endpoints.
- `src/app/{login,signup,onboarding,dashboard}` — the pages.
- `src/components/Tracker.tsx` — the dashboard's interactive UI.
- `prisma/schema.prisma` — `User` and `CheckIn` models.

## Origin

`legacy-artifact/` holds the original single-file version of this tracker — a static HTML page published as a Claude artifact, synced via Claude's `db` capability instead of a real account system. Kept for reference; the Next.js app above is the one to use going forward.
