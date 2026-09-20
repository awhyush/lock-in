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
2. **Onboarding**: pick an intensity — Light, Standard, or Ambitious — which scales every habit's target minutes/aim (`src/lib/habits.ts`, `HABIT_TARGETS`).
3. **Dashboard**: greets you by name, shows today's habits against that day's weekday rules (e.g. Tuesday's football night counts as movement, no study expected), a running streak, and a 14-day history strip. Every tap writes straight to your account via `POST /api/checkin`.

## Structure

- `src/lib/habits.ts` — habit/intensity/weekday config and the streak logic, shared by the server and the client.
- `src/auth.ts` — NextAuth config (Credentials provider, JWT sessions).
- `src/app/api/*` — signup, onboarding, and check-in endpoints.
- `src/app/{login,signup,onboarding,dashboard}` — the pages.
- `src/components/Tracker.tsx` — the dashboard's interactive UI.
- `prisma/schema.prisma` — `User` and `CheckIn` models.

## Origin

`legacy-artifact/` holds the original single-file version of this tracker — a static HTML page published as a Claude artifact, synced via Claude's `db` capability instead of a real account system. Kept for reference; the Next.js app above is the one to use going forward.
