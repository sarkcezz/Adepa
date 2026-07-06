# Backend migration → Vercel + Neon Postgres

Porting the Laravel API (Hostinger/MySQL) to Next.js Route Handlers backed by
Neon Postgres via Drizzle ORM. The frontend (`frontend-next`) stays; the backend
moves in behind `/api/*` so the app becomes a single Vercel deployment.

## Stack
- **DB:** Neon serverless Postgres (`@neondatabase/serverless`, HTTP driver)
- **ORM:** Drizzle (`db/schema.ts`, migrations in `db/migrations/`)
- **API:** Next.js Route Handlers under `frontend-next/app/api/*`
- **Auth:** bearer tokens (`auth_tokens` table), bcrypt passwords — mirrors Sanctum
- **Cron/async:** Vercel Cron + Workflow (replaces Laravel scheduler + queues)

## Phases
1. **Schema** ✅ — MySQL → Drizzle Postgres schema + `0000_init` migration + seed
2. **Data** — MySQL dump → Postgres load (at cutover; using fresh schema + seed for now)
3. **Auth** — register / login / employee-login / password reset / change
4. **Core reads** — products, announcements, events, addresses, orders (GET)
5. **Orders / POS** — checkout, employee-sale, status machine, Paystack webhooks
6. **Admin** — campaigns, customers, employees, analytics, audit logs, uploads
7. **Async** — email/SMS (queues), cron (backup, daily summary, low-stock)
8. **Cutover** — point `NEXT_PUBLIC_API_BASE_URL` at `/api`, retire Hostinger

## Provisioning Neon (one-time, requires your Vercel login)
1. Vercel dashboard → project **adepa** → **Storage** → **Create Database** → **Neon Postgres**.
   This injects `DATABASE_URL` into the project's env for all environments.
2. Pull env locally: `vercel env pull .env.local` (or paste the Neon string into `.env.local`).

## Apply schema + seed
```bash
cd frontend-next
npm run db:migrate   # applies db/migrations to Neon
npm run db:seed      # admin + employee + sample catalog
```
Seed prints the admin/employee credentials (override via SEED_ADMIN_PASSWORD /
SEED_STAFF_PASSWORD). `npm run db:studio` opens Drizzle Studio to inspect data.

## Regenerating the schema
Edit `db/schema.ts`, then `npm run db:generate` to produce the next migration.
