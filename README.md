# Adepa Pork Hub

> **Fresh. Spiced. Ready for Every Meal.**
>
> A premium Ghanaian pork e-commerce + operations platform — Next.js on Vercel, Neon Postgres.

---

## What's in this repo

```
.
├── frontend-next/    Next.js app (storefront, account, staff/POS, admin) + API
│   ├── app/          Pages + Route Handlers under app/api/*
│   └── db/           Drizzle schema, migrations, seed scripts
└── docs/
    └── NEON_MIGRATION.md   Backend setup + provisioning runbook
```

## Tech stack

| Layer        | Choice |
|--------------|--------|
| Framework    | Next.js (App Router, Turbopack) + React 19 + TypeScript |
| API          | Next.js Route Handlers (`app/api/*`) |
| Database     | Neon serverless Postgres, via Drizzle ORM |
| Auth         | Bearer tokens (bcrypt passwords) |
| State        | Zustand (auth + cart persisted to localStorage) |
| Styling      | Tailwind v4, shadcn/ui (Base UI) |
| Payments     | Paystack (popup/inline) |
| Hosting      | Vercel (frontend + API), Vercel Cron for scheduled jobs |

## Quick start (local dev)

```bash
cd frontend-next
npm install
cp .env.example .env.local
# Fill in DATABASE_URL (Neon connection string)
npm run db:migrate     # apply schema to Neon
npm run db:seed        # creates the first admin account
npm run dev            # → http://localhost:3000
```

See **[docs/NEON_MIGRATION.md](docs/NEON_MIGRATION.md)** for provisioning Neon,
seeding options, and the schema workflow.

## Data strategy

Clean launch — no legacy data. `db:seed` creates only the first admin account;
the product catalog, staff, campaigns, and events are all built through the
admin UI.

## Project structure highlights

- ✅ UUID primary keys on all business tables
- ✅ Prices in pesewas (GHS × 100, integer) — no float math anywhere
- ✅ Status timeline persisted to `order_status_history`
- ✅ Bearer-token auth with role-based route guards (customer / employee / admin)
- ✅ Idempotent POS sales (offline queue + client-reference replay protection)
- ✅ Audit logging on admin mutations
