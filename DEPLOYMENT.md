# Adepa Pork Hub — Hostinger Deployment Guide

This guide walks a non-technical operator through deploying both halves of the platform onto **Hostinger shared hosting**:

- **Backend:** Laravel 11 (lives outside `public_html` for security)
- **Frontend:** React (Vite build, copied into `public_html`)
- **Database:** MySQL 8.0 (created via hPanel)

---

## Step 1 — Create the database

1. Log in to **hPanel → Hosting → Manage → Databases → MySQL Databases**.
2. Create a new database, e.g. `adepaporkhub_db`.
3. Create a database user, e.g. `adepaporkhub_user`, with a strong password — **save it**.
4. Assign the user to the database with **ALL PRIVILEGES**.
5. Note: DB host (usually `127.0.0.1`), DB name, username, password.

> You can either:
> **(A)** Import the standalone `adepa_pork_hub_schema.sql` via phpMyAdmin, **or**
> **(B)** Let Laravel migrations create everything in Step 3.

---

## Step 2 — Enable Free SSL & subdomain (recommended)

1. **hPanel → SSL → Free SSL** — enable for the main domain.
2. **hPanel → Subdomains → Create subdomain** `api.adepaporkhub.shop` and point its document root to `~/laravel/public`.

If you can't use a subdomain, see "Subfolder option" at the bottom.

---

## Step 3 — Upload & configure the Laravel backend

1. **Locally**, prepare the backend:
   ```bash
   cd backend
   composer install --no-dev --optimize-autoloader
   ```
2. **Zip** the `backend/` folder (exclude `node_modules`, `.git`) and upload it via **hPanel → File Manager** or SFTP to your home directory (`~/`).
3. **Rename / extract** so it lives at `~/laravel/`.
4. **SSH into the server** (hPanel → Advanced → SSH Access):
   ```bash
   cd ~/laravel
   cp .env.example .env
   nano .env                       # paste DB + API credentials
   php artisan key:generate
   php artisan migrate --force
   php artisan db:seed --force
   chmod -R 775 storage bootstrap/cache
   ```
5. **Verify**: `https://api.adepaporkhub.shop/api/v1/products` should return a JSON product list.

### .env essentials to fill in

| Variable | Where to find it |
|---|---|
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | hPanel → Databases |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | Paystack dashboard → Settings → API Keys |
| `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET`, `HUBTEL_SENDER_ID` | Hubtel dashboard |
| `MAIL_PASSWORD` | SendGrid API key (username stays `apikey`) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary dashboard |
| `FRONTEND_URL` | Your frontend URL — `https://adepaporkhub.shop` |

---

## Step 4 — Build & upload the React frontend

1. **Locally**, create `.env`:
   ```env
   VITE_API_BASE_URL=https://api.adepaporkhub.shop/api/v1
   VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxx
   VITE_WHATSAPP_NUMBER=233500000000
   ```
2. **Build:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```
3. **Upload** the contents of `frontend/dist/` (not the folder itself — the files inside) **and** the `frontend/public/.htaccess` file into `public_html/` on Hostinger.
4. **Verify**: visit `https://adepaporkhub.shop` — the homepage should load.

---

## Step 5 — Set up the Hostinger cron job

The cron runs Laravel's scheduler every minute. It drains queued emails/SMS jobs.

**hPanel → Advanced → Cron Jobs → Add new cron job:**

| Field | Value |
|---|---|
| Type | Custom (every minute) |
| Schedule | `* * * * *` |
| Command | `php /home/USERNAME/laravel/artisan schedule:run >> /dev/null 2>&1` |

Replace `USERNAME` with your Hostinger account username.

---

## Step 6 — Paystack webhook

In **Paystack Dashboard → Settings → API Keys & Webhooks**:

- **Webhook URL:** `https://api.adepaporkhub.shop/api/v1/payments/webhook`
- **Enable events:** `charge.success`, `charge.failed`

The endpoint verifies HMAC-SHA512 with your secret key — invalid signatures get 403.

---

## Step 7 — Test the deployment end to end

1. ✅ `https://adepaporkhub.shop` — React app loads
2. ✅ `https://api.adepaporkhub.shop/api/v1/products` — JSON product list
3. ✅ Register a customer → login → add to cart → checkout → Paystack → order created
4. ✅ Admin login at `/login` with `admin@adepaporkhub.shop` / your `ADMIN_PASSWORD` → goes to `/admin`
5. ✅ Employee login at `/employee/login` with `APH-0001` / `Employee@2025!` → goes to `/employee`

---

## Default credentials (change immediately after first deploy)

| Role | Email / ID | Password |
|---|---|---|
| Admin | `admin@adepaporkhub.shop` | value of `ADMIN_PASSWORD` in `.env` |
| Employee 1 | `APH-0001` | `Employee@2025!` (forced change on first login) |
| Employee 2 | `APH-0002` | `Employee@2025!` (forced change on first login) |
| Customer (seed) | `kofi.boateng@gmail.com` | `Customer@2025!` |

---

## Subfolder option (if you can't use a subdomain)

If `api.adepaporkhub.shop` isn't possible:

1. Create `public_html/api/` and copy contents of `~/laravel/public/` into it.
2. Edit `public_html/api/index.php`:
   ```php
   require __DIR__.'/../../laravel/vendor/autoload.php';
   $app = require_once __DIR__.'/../../laravel/bootstrap/app.php';
   ```
3. In **frontend `.env`**, set `VITE_API_BASE_URL=https://adepaporkhub.shop/api/api/v1`.
4. Webhook URL becomes `https://adepaporkhub.shop/api/api/v1/payments/webhook`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `500 Server Error` on API | Check `storage/logs/laravel.log` via File Manager. Most common cause: missing `APP_KEY` or wrong DB credentials. |
| React app loads but pages 404 on refresh | `.htaccess` missing in `public_html/` — re-upload it. |
| Paystack popup not opening | `VITE_PAYSTACK_PUBLIC_KEY` not set during build → rebuild after editing `.env`. |
| Emails not arriving | Verify SendGrid API key has "Mail Send" permission; check spam folder. |
| SMS not sending | Check `HUBTEL_*` envs and Hubtel account credit. SMS is best-effort and won't block orders. |
| Cron not running | hPanel cron logs — verify path to `artisan` is your home dir, not relative. |

---

## Updating after launch

To deploy a code change:

```bash
# Locally
cd backend  && composer install --no-dev --optimize-autoloader
cd frontend && npm run build

# Upload backend changes to ~/laravel
# Upload contents of frontend/dist/ to public_html/

# SSH:
cd ~/laravel
php artisan migrate --force        # if migrations changed
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

That's it — happy shipping! 🍖
