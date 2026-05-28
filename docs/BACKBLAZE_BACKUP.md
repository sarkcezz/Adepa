# Off-site backup via Backblaze B2

Backblaze B2 has a generous free tier (10GB stored, 1GB/day download) and an
S3-compatible API, so we treat it as just another filesystem disk.

## Why Backblaze (not Google Drive / S3)

- **Free tier covers years of nightly SQL dumps** (typical Adepa dump is <100KB → 10GB ≈ ~270 years of nightly backups even uncompressed).
- **No quota gymnastics** like Google Drive's service-account-can't-store-files rule.
- **Standard S3 API** — uses Laravel's existing filesystem driver, no custom SDK.
- **Cheap if you outgrow free tier** — $0.005/GB/month storage.

---

## One-time setup (~10 minutes)

### 1. Create a Backblaze account

1. Go to **https://www.backblaze.com/b2/sign-up.html**
2. Sign up with your email (no credit card needed for free tier)
3. Verify email + log in

### 2. Create a private bucket

1. **Buckets → Create a Bucket**
2. Name: `adepa-backups` (must be globally unique — append your initials if taken, e.g. `adepa-backups-em`)
3. **Files in Bucket are: Private** (do NOT make public!)
4. Default encryption: leave off
5. Object Lock: off (you can enable later for ransomware protection)
6. Click **Create a Bucket**

Note your bucket's **region** — shown in the bucket details, like `us-west-002` or `eu-central-003`.

### 3. Create an application key

1. **App Keys → Add a New Application Key**
2. Name: `adepa-backup-uploader`
3. **Allow access to Bucket(s)** → select your bucket (NOT "All")
4. Type of Access: **Read and Write**
5. **Allow List All Bucket Names**: off
6. File name prefix: leave blank
7. Click **Create New Key**

A panel appears with:
- **keyID** (looks like `0021abc123def456`)
- **applicationKey** (longer string)

**Save both NOW** — Backblaze only shows the applicationKey once.

### 4. Note the S3 endpoint

In the bucket details, find the **Endpoint** line. It looks like:
```
s3.us-west-002.backblazeb2.com
```

You'll need this prefixed with `https://`.

### 5. Add env vars on Hostinger

SSH in and edit `.env`:

```bash
cd /home/u581126080/domains/adepaporkhub.shop/laravel
nano .env
```

Add (or update):
```dotenv
B2_KEY_ID=0021abc123def456
B2_APPLICATION_KEY=K002paste-your-application-key-here
B2_BUCKET=adepa-backups
B2_REGION=us-west-002
B2_ENDPOINT=https://s3.us-west-002.backblazeb2.com
OFFSITE_DISK=b2
OFFSITE_KEEP_DAYS=30
```

(Adjust region/endpoint/bucket to whatever you used in steps 2-4.)

### 6. Reload config + test

```bash
php artisan config:clear
php artisan config:cache
php artisan adepa:backup
```

Expected output:
```
Starting database backup…
  · users
  · products
  ...
Wrote backups/adepa-2026-05-28_HHMMSS.sql.gz (~23.1KB)
  ↑ Uploaded off-site: backups/adepa-2026-05-28_HHMMSS.sql.gz
```

Verify in the Backblaze console → your bucket → **Browse Files** → you should see `backups/adepa-...sql.gz`.

---

## Restore from a backup

1. **Backblaze console → bucket → Browse Files → Download** the `.sql.gz`
2. Gunzip locally: `gunzip adepa-2026-05-28_HHMMSS.sql.gz`
3. Import in hPanel → phpMyAdmin → Import → choose the `.sql` file → Go

---

## Troubleshooting

**`The specified key does not exist`**
- `B2_KEY_ID` or `B2_APPLICATION_KEY` is wrong — re-copy from Backblaze
- Or the application key was scoped to a different bucket

**`Could not connect to host`**
- `B2_ENDPOINT` is wrong — it must match the bucket's region
- Common regions: `us-west-002`, `us-west-004`, `us-east-005`, `eu-central-003`

**`Access Denied` on upload**
- Application key type was set to "Read Only" instead of "Read and Write"
- Re-create the key with the right type

**Upload silently skipped (`Off-site backup not configured`)**
- One of `B2_KEY_ID` / `B2_APPLICATION_KEY` / `B2_BUCKET` is blank
- Verify with `php artisan tinker --execute="dd(config('filesystems.disks.b2'));"`

---

## Switching to a different S3-compatible provider

The backup code uses any S3-compatible disk. To use AWS S3, Cloudflare R2,
DigitalOcean Spaces, etc. instead:

1. Add a new disk in `config/filesystems.php` with that provider's settings
2. Change `OFFSITE_DISK=...` in `.env` to point at your new disk name

No code changes needed.
