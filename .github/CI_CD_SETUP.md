# CI/CD setup — GitHub Actions → Hostinger

The workflow at `.github/workflows/deploy.yml` runs two jobs:

| Job | When | What it does |
|-----|------|-------------|
| **ci** | Every push + PR | Lints, type-checks, and builds both frontend and backend in a clean Ubuntu runner. Fails fast if anything is broken. |
| **deploy** | Push to `main` only, after CI passes | Builds frontend with production secrets, rsyncs frontend → `public_html/`, rsyncs backend → `laravel/`, then SSHes in to run `composer install` and rebuild Laravel caches. |

Frontend deploy preserves `public_html/api/` (the Laravel bridge). Backend deploy preserves `.env`, `storage/`, and `vendor/`.

---

## One-time setup

### 1. Generate an SSH key for deployments

On your local machine:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/adepa_deploy -C "github-actions@adepaporkhub" -N ""
```

This creates two files:
- `~/.ssh/adepa_deploy`     ← **private key** (goes into GitHub secrets)
- `~/.ssh/adepa_deploy.pub` ← public key (goes onto Hostinger)

### 2. Authorize the key on Hostinger

In **hPanel → Advanced → SSH Access**, paste the contents of `~/.ssh/adepa_deploy.pub` into the **SSH Keys** field.

Alternatively, copy it via the existing SSH session:

```bash
# On your local machine, copy the public key
cat ~/.ssh/adepa_deploy.pub
```

Then SSH into Hostinger and append it:

```bash
ssh u581126080@your-hostinger-host -p 65002
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Verify the key works (from your local machine):

```bash
ssh -i ~/.ssh/adepa_deploy -p 65002 u581126080@your-hostinger-host "echo OK"
```

You should see `OK` print with no password prompt.

### 3. Add GitHub secrets

Go to **github.com/sarkcezz/Adepa → Settings → Secrets and variables → Actions → New repository secret**.

Add these:

| Secret name | Value |
|-------------|-------|
| `HOSTINGER_SSH_HOST` | Your Hostinger SSH host (e.g. `145.223.xxx.xxx` or `de-fra-web1800.main-hosting.eu` — check hPanel → SSH Access) |
| `HOSTINGER_SSH_PORT` | `65002` (Hostinger's standard SSH port — check hPanel) |
| `HOSTINGER_SSH_USER` | `u581126080` |
| `HOSTINGER_SSH_KEY` | **Entire contents** of `~/.ssh/adepa_deploy` (including `-----BEGIN/END OPENSSH PRIVATE KEY-----` lines) |
| `VITE_API_BASE_URL` | `https://api.adepaporkhub.shop/api/v1` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Your `pk_live_...` key from Paystack |
| `VITE_WHATSAPP_NUMBER` | `233500000000` (or your actual number) |

### 4. Set up the `production` environment (optional but recommended)

In **Settings → Environments → New environment → `production`**, you can:
- Require manual approval before deploys run
- Restrict deploys to the `main` branch only
- Show a clear "production" badge on each run

The workflow already references `environment: production` on the deploy job — once you create the environment, it'll show up.

---

## How a deploy plays out

1. You push to `main` (or merge a PR)
2. **ci** job runs (~2-3 min)
   - Frontend: `npm ci` → `npm run build` (type-check + bundle)
   - Backend: `composer validate` → `composer install` → PHP syntax check
3. **deploy** job runs (~3-5 min)
   - Builds frontend with real production secrets
   - rsyncs frontend `dist/` into `public_html/` (keeping `api/` intact)
   - rsyncs backend code into `laravel/` (keeping `.env`, `storage/`, `vendor/` intact)
   - SSHes in and runs `composer install --no-dev`, rebuilds all Laravel caches, restarts queue workers
4. You see a notice in the workflow summary linking to the live URLs

---

## Manual deploy

To deploy without a code change (e.g. to force a cache rebuild):

```bash
# Make an empty commit
git commit --allow-empty -m "Trigger deploy"
git push
```

Or use **Actions → CI & Deploy → Run workflow** in the GitHub UI if you change the trigger to include `workflow_dispatch`.

---

## What's NOT touched by deploys

- `backend/.env` — production credentials live only on the server
- `backend/storage/` — uploaded files, logs, framework cache
- `backend/vendor/` — rebuilt fresh by `composer install` on each deploy
- `public_html/api/` — the Laravel bridge (`index.php` + `.htaccess`)

If you need to change any of these, do it via SSH directly.

---

## Rollback

```bash
# On your local machine
git revert HEAD
git push

# Or reset to a known-good commit
git reset --hard <good_sha>
git push --force-with-lease   # only if you understand force-push implications
```

The next deploy will sync the older state onto the server.

---

## Troubleshooting

**CI fails on type-check**: Run `npm run build` locally — the same errors will show up. Fix and re-push.

**Deploy fails on `ssh: Permission denied`**: SSH key isn't authorized on Hostinger, or the wrong host/port. Test with `ssh -i ~/.ssh/adepa_deploy -p 65002 u581126080@<host>` manually.

**Deploy succeeds but site shows 500**: Check `~/laravel/storage/logs/laravel.log` over SSH. Most common cause is a stale config cache — the workflow runs `php artisan config:cache` after each deploy, but if `.env` was changed manually first, clear it: `php artisan config:clear && php artisan config:cache`.

**Composer install fails on Hostinger**: The `--ignore-platform-req=php` flag is already set. If a specific package still complains, lock its version in `composer.json` and commit `composer.lock`.
