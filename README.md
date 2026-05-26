# Adepa Pork Hub

> **Fresh. Spiced. Ready for Every Meal.**
>
> A production-ready e-commerce + operations platform for Adepa Pork Hub — built for Hostinger shared hosting.

---

## What's in this repo

```
.
├── backend/                     Laravel 11 API
├── frontend/                    React 18 + Vite + Tailwind SPA
├── adepa_pork_hub_schema.sql    Standalone SQL schema (for direct phpMyAdmin import)
├── DEPLOYMENT.md                Step-by-step Hostinger deployment guide
└── README.md                    You're here
```

## Tech stack

| Layer        | Choice |
|--------------|--------|
| Backend      | PHP 8.1 + Laravel 11 + Sanctum (token auth) |
| Database     | MySQL 8.0 |
| Frontend     | React 18 + TypeScript + Vite + Tailwind |
| State        | Zustand (auth + cart persisted to localStorage) |
| Charts       | Recharts |
| Payments     | Paystack (popup/inline) |
| SMS          | Hubtel SMS (Ghana) |
| Email        | SendGrid SMTP |
| Images       | Cloudinary (server-side upload) |

## Architecture (Hostinger-shaped)

```
public_html/                          ← React build + .htaccess (SPA fallback + HTTPS)
├── index.html
└── assets/

~/laravel/                            ← Laravel app, outside webroot
├── app/  config/  database/  routes/
└── public/  (set as document root for api.adepaporkhub.com)

Cron:  * * * * *  php ~/laravel/artisan schedule:run
       └─→ drains DB queue every minute (emails, SMS)
```

No Node server, no Redis, no WebSockets — order tracking uses 10-second polling against a lightweight `/orders/{id}/status` endpoint.

## Quick start (local dev)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Edit .env with local MySQL creds
php artisan migrate --seed
php artisan serve                     # → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_PROXY=http://localhost:8000 for dev
npm run dev                           # → http://localhost:5173
```

The Vite dev server proxies `/api/*` to Laravel.

## Default seeded credentials

| Role     | Login                          | Password               |
|----------|--------------------------------|------------------------|
| Admin    | `admin@adepaporkhub.com`       | `ChangeMe@2025!`       |
| Employee | `APH-0001`                     | `Employee@2025!`       |
| Customer | `kofi.boateng@gmail.com`       | `Customer@2025!`       |

**Change these immediately after first deploy.**

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Hostinger walkthrough.

## API surface (highlights)

All routes under `/api/v1`:

- `POST /auth/register`, `/auth/login`, `/auth/employee/login`
- `GET  /products` (filterable), `/products/{id}`
- `GET  /announcements/active`, `/events/upcoming`
- `POST /campaigns/validate` (promo code)
- `POST /orders` (online), `/orders/employee-sale`
- `GET  /orders/{id}/status` (lightweight, polled every 10s)
- `POST /payments/webhook` (Paystack HMAC verified)
- `GET  /admin/orders`, `/admin/analytics/*`, `/admin/employees`, etc.

## Project highlights

- ✅ UUID primary keys on all business tables
- ✅ Prices in pesewas (GHS × 100, integer) — no float math anywhere
- ✅ Status timeline persisted to `order_status_history`
- ✅ Email + SMS via queued jobs (database driver, drained by cron)
- ✅ Paystack webhook with HMAC-SHA512 signature verification
- ✅ Role-based middleware: customer / employee / admin
- ✅ CSV export streamed directly (no temp files)
- ✅ Mobile-first (375px tested), Ghana-tuned phone validation regex
- ✅ Cloudinary uploads — secrets never exposed to the client
