# Backend — Next.js + Neon Postgres

The Adepa Pork Hub API runs as Next.js Route Handlers under `frontend-next/app/api/*`,
backed by Neon serverless Postgres via Drizzle ORM. Vercel hosts both the
frontend and the API as a single deployment. There is no other backend —
the earlier Laravel/MySQL/Hostinger stack has been fully retired.

## Stack
- **DB:** Neon serverless Postgres (`@neondatabase/serverless`, HTTP driver)
- **ORM:** Drizzle (`db/schema.ts`, migrations in `db/migrations/`)
- **API:** Next.js Route Handlers under `frontend-next/app/api/*`
- **Auth:** bearer tokens (`auth_tokens` table), bcrypt passwords
- **Cron/async:** Vercel Cron (`vercel.json`)

## Data strategy: clean launch
No data was migrated from the old system. `db:seed` creates only the first
admin account — the catalog, staff, campaigns, and events are built from
scratch in the admin UI.

## Provisioning Neon (one-time, requires your Vercel login)
1. Vercel dashboard → project **adepa** → **Storage** → **Create Database** → **Neon Postgres**.
   This injects `DATABASE_URL` into the project's env for all environments.
2. Pull env locally: `vercel env pull .env.local` (or paste the Neon string into `.env.local`).

## Apply schema + seed
```bash
cd frontend-next
npm run db:migrate     # applies db/migrations to Neon
npm run db:seed        # creates only the admin account
# or, for a populated test dataset:
npm run db:seed:demo   # admin + employee + 2 customers + sample catalog/campaign/event
```
`db:seed` creates just the first admin — everything else (products, staff,
campaigns, events) is built in the admin UI. Override the admin via
SEED_ADMIN_NAME/EMAIL/PHONE/PASSWORD; the account starts with
force_password_change so the first login prompts a reset.
`npm run db:studio` opens Drizzle Studio to inspect data.

## Regenerating the schema
Edit `db/schema.ts`, then `npm run db:generate` to produce the next migration.
