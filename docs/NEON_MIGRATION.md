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
2. **Data** ✅ tooling — `npm run db:import` copies the legacy MySQL into Neon (see below)
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
npm run db:migrate     # applies db/migrations to Neon
npm run db:seed        # CLEAN LAUNCH: creates only the admin account
# or, for a populated test dataset:
npm run db:seed:demo   # admin + employee + 2 customers + sample catalog/campaign/event
```
`db:seed` is the clean-launch path (chosen data strategy): it creates just the
first admin — everything else (products, staff, campaigns, events) is built in
the admin UI. Override the admin via SEED_ADMIN_NAME/EMAIL/PHONE/PASSWORD; the
account starts with force_password_change so the first login prompts a reset.
`npm run db:studio` opens Drizzle Studio to inspect data.

If you later want to bring real data over instead, see **Phase 2** below.

## Phase 2 — importing production data (MySQL → Neon)

`db/import-mysql.ts` copies every table from the legacy Laravel MySQL DB into
Neon in FK-safe order, converting types (tinyint→boolean, JSON→jsonb,
date/time). **User password hashes carry over**, so existing accounts keep
their passwords. It TRUNCATEs the Neon tables first (pass `--no-truncate` to
append). Missing source columns/tables are tolerated.

1. Get a MySQL connection from Hostinger — hPanel → **Databases → Remote MySQL**
   (whitelist your IP), or open an SSH tunnel to the DB host.
2. Run it:
   ```bash
   cd frontend-next
   SOURCE_MYSQL_URL="mysql://user:pass@host:3306/dbname" npm run db:import
   ```
3. Spot-check with `npm run db:studio`, then re-point the app at `/api`.

Verified against a MySQL 8 instance loaded from `adepa_pork_hub_schema.sql`:
users (hashes intact), products, campaigns (jsonb), announcements (jsonb),
orders + items + status history (FKs intact) all copy correctly.

## Regenerating the schema
Edit `db/schema.ts`, then `npm run db:generate` to produce the next migration.
