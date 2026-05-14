# Stack differences & deployment (vs Vercel + Supabase)

This doc is for you if you are used to **Vercel + Supabase** and this project feels heavier. It is not “harder” at heart: you still deploy a **Next.js app** to **Vercel** and point it at a **Postgres** database. What changed is **how the database schema is managed**.

---

## What you did before (Vercel + Supabase) — why it felt easy

Typical mental model:

1. **Supabase** gives you a hosted **Postgres** database plus a nice dashboard (tables, SQL editor, sometimes Auth/Storage).
2. You **create tables** by pasting SQL in the SQL editor, or using Supabase UI, or running a dump.
3. **Vercel** gets the **connection string** (`DATABASE_URL`) as an environment variable.
4. Your app connects and runs queries.

The “easy” part is: **one vendor for DB UI + connection string + Vercel integration docs**. The schema might live **only in Supabase** (or in random SQL files), not necessarily as the single source of truth in your Git repo.

---

## What this project does differently

This repo uses **Prisma**:

| Piece | Role |
|--------|------|
| `prisma/schema.prisma` | **Single source of truth** for tables, columns, relations (in Git). |
| `prisma/migrations/*.sql` | **Versioned SQL** that turns the schema into real DDL over time. |
| Generated client (`src/generated/prisma`) | Type-safe queries from TypeScript (`prisma.product.findMany()`, etc.). |
| `src/lib/prisma.ts` | Shared `PrismaClient` for Next.js (with the `pg` adapter). |

So instead of “I run SQL in Supabase when I remember,” the workflow is:

1. Change **`schema.prisma`** (or pull someone else’s migration).
2. Apply migrations to the database: **`prisma migrate deploy`** (production) or **`prisma migrate dev`** (local).
3. **`prisma generate`** updates the TypeScript client (your `npm run build` already runs this).

**Important:** You are **not** locked out of Supabase. Supabase’s product is still **Postgres**. You *can* use **Supabase Postgres** as the database and **Prisma** as the schema/migration layer. The friction you feel is mostly **Prisma’s workflow**, not “Neon vs Supabase.”

Comments in this repo mention **Neon** (another Postgres host, popular with Vercel). Treat **Neon / Supabase / Railway / any Postgres** the same way: give Prisma a valid **`DATABASE_URL`**.

---

## Why this stack *feels* more complex

1. **Two URLs (sometimes)**  
   Hosted Postgres often gives a **pooled** URL (good for serverless) and a **direct** URL (better for migrations). This repo’s `prisma.config.ts` uses `DIRECT_URL` when set, else `DATABASE_URL`, so migrations don’t silently fail against the wrong endpoint.

2. **Migrations are a separate step from “deploy the site”**  
   Vercel deploys your **code**. Your **database** must already have tables that match the migrations, unless you run migrations as part of CI/CD or a one-off command.

3. **Prisma Client must be generated**  
   Already wired via `postinstall` / `build`; you only need to remember it after schema changes if something looks “out of sync.”

None of this is unique to leaving Supabase — it is **normal for Prisma + serverless Postgres**.

---

## Mental model: one picture

```
Git repo                    Your host (e.g. Vercel)
┌─────────────────┐         ┌──────────────────────────┐
│ schema.prisma   │         │ Next.js app               │
│ migrations/     │ ──────► │ uses @/lib/prisma        │
└────────┬────────┘         └────────────┬─────────────┘
         │                               │
         │  prisma migrate deploy        │  DATABASE_URL
         ▼                               ▼
         ┌───────────────────────────────────────┐
         │  Postgres (Neon / Supabase / other)   │
         └───────────────────────────────────────┘
```

---

## Environment variables (check `.env.example`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | App + Prisma: **pooled** connection string if your provider offers it (common for Vercel/serverless). |
| `DIRECT_URL` | Optional but recommended for **migrations** on Neon-like hosts: **non-pooled** / direct connection. If unset, Prisma CLI falls back to `DATABASE_URL`. |
| `AUTH_SECRET` | Required for admin/auth session signing (see `.env.example`). |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (production domain). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin login behavior (see project docs / seed). |

Copy `.env.example` to `.env` locally; in Vercel, set the same keys under **Project → Settings → Environment Variables**.

---

## Deploying to Vercel (recommended path)

### 1. Create production Postgres

- **Option A — Neon:** Create a project, copy **pooled** URI → `DATABASE_URL`, and **direct** URI → `DIRECT_URL` (names vary slightly in the Neon UI; both are documented in Neon’s Prisma guide).
- **Option B — Supabase:** In **Project Settings → Database**, copy the **connection string**. Use **Transaction** mode / pooler for `DATABASE_URL` if you use PgBouncer; use **Session** or direct host for `DIRECT_URL` when Prisma migrations fail with pooler-related errors.

### 2. Connect the Git repo to Vercel

Import the repo, framework **Next.js**, use defaults unless you have a monorepo.

### 3. Set environment variables in Vercel

Add at least: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, and any payment keys you use. Add `DIRECT_URL` if you use it for migrations.

### 4. Apply the database schema **before** (or right after) the first deploy

Your production DB must have tables matching `prisma/migrations/`. From your **machine** (with production URLs in env) or **CI**:

```bash
npx prisma migrate deploy
```

Or one-time locally:

```bash
# Windows PowerShell: set env for the session, then deploy migrations
$env:DATABASE_URL="postgresql://..."   # and DIRECT_URL if needed
npx prisma migrate deploy
```

This applies existing migration SQL files; it does **not** require you to paste SQL into a dashboard.

**Optional:** seed demo data (only if you want the same seed as local):

```bash
npx tsx prisma/seed.ts
```

(Ensure `DATABASE_URL` points at production when you run this.)

### 5. Deploy on Vercel

Push to `main` or trigger a deploy. The default **`build`** script runs `prisma generate` then `next build`, which is what you want.

**Note:** This repo’s `build` script does **not** run `migrate deploy` automatically. Many teams run migrations in a **GitHub Action** or manually once per release to avoid concurrent migration runs. Pick one strategy and stay consistent.

---

## Quick comparison table

| Topic | Supabase + Vercel (typical) | This repo |
|--------|-----------------------------|-----------|
| Database | Postgres (Supabase-hosted) | Postgres (any host; Neon mentioned in comments) |
| Where schema lives | Often Supabase UI / SQL editor | **`prisma/schema.prisma` + migrations in Git** |
| Applying schema | Paste SQL / run in dashboard | **`prisma migrate deploy`** (prod) or **`migrate dev`** (local) |
| App queries | Driver or ORM of choice | **Prisma Client** via `@/lib/prisma` |
| Connection | `DATABASE_URL` on Vercel | Same idea; optionally **`DIRECT_URL`** for migrations |

---

## If you want the old “Supabase dashboard” feeling

- You can still open **Supabase Table Editor** or **Prisma Studio** (`npx prisma studio`) to **inspect** data.
- Just avoid **manually** changing production schema in the UI in a way that **drifts** from `schema.prisma` / migrations, or the next `migrate deploy` can conflict. For team projects, treat Prisma migrations as the authority.

---

## Troubleshooting one-liners

- **“Table does not exist”** — Migrations not applied on that database; run `npx prisma migrate deploy` against the **same** `DATABASE_URL` the app uses (with pooling caveats understood).
- **Migration errors with pooler** — Set `DIRECT_URL` to a **non-pooled** connection and ensure `prisma.config.ts` can read it (see Prisma + Neon/Supabase docs).
- **Types out of date after pulling** — Run `npx prisma generate`.

---

## Summary

- **Vercel + Supabase** felt easy because **one dashboard + one connection string** covered a lot.
- **This project** adds **Prisma**: schema and migrations **live in the repo**, and you **apply** them with the Prisma CLI. The deployment target is still **Vercel + Postgres**.
- You **can** keep using **Supabase as the Postgres provider**; swap only the connection strings and respect pooler vs direct URLs for migrations.

When in doubt: **same `DATABASE_URL` family of docs as “Prisma + your DB host + Vercel”** — that is the search phrase that maps closest to what you are doing now.
