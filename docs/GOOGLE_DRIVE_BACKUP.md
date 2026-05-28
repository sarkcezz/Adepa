# Google Drive backup — setup

Once-per-installation setup to point `adepa:backup` at a shared Google Drive folder.

## 1. Create the Google Cloud project + service account

1. Go to **https://console.cloud.google.com/** → create new project named `adepa-backups`
2. Sidebar → **APIs & Services → Library** → search **Google Drive API** → **Enable**
3. Sidebar → **APIs & Services → Credentials** → **Create Credentials → Service Account**
   - Name: `adepa-backup-uploader`
   - Click **Create and Continue**, skip the optional grants
4. Once created, click the new service account → **Keys** tab → **Add Key → Create new key → JSON**
   - A `.json` file downloads — keep it safe, you'll upload it to Hostinger next

The JSON file contains a field `"client_email"` that looks like:
```
adepa-backup-uploader@adepa-backups-xxxxx.iam.gserviceaccount.com
```
Copy that email — you'll share the Drive folder with it.

## 2. Create the Drive folder

1. **drive.google.com** → **New → New folder** → name it `Adepa Backups`
2. Right-click the folder → **Share**
3. Add the service account email from step 1 → **Editor** role → uncheck "notify" → **Share**
4. Open the folder in Drive — copy the **folder ID** from the URL. It looks like:
   ```
   https://drive.google.com/drive/folders/1abc2DEF3ghi4JKL5mno6PQR
                                          └── this part ──┘
   ```

## 3. Upload the credential file to Hostinger

```bash
# From your Mac, where the JSON downloaded
scp -P 65002 ~/Downloads/adepa-backups-xxxxx.json \
  u581126080@<host>:domains/adepaporkhub.shop/laravel/storage/app/google-drive-key.json
```

Lock it down:
```bash
# On Hostinger
chmod 600 /home/u581126080/domains/adepaporkhub.shop/laravel/storage/app/google-drive-key.json
```

## 4. Set env vars

```bash
cd /home/u581126080/domains/adepaporkhub.shop/laravel
nano .env
```

Add:
```dotenv
GOOGLE_DRIVE_KEY_FILE=storage/app/google-drive-key.json
GOOGLE_DRIVE_FOLDER_ID=1abc2DEF3ghi4JKL5mno6PQR
GOOGLE_DRIVE_KEEP_DAYS=30
```

Rebuild config cache:
```bash
php artisan config:clear
php artisan config:cache
```

## 5. Test

```bash
php artisan adepa:backup
```

Expected output:
```
Starting database backup…
  · users
  · products
  ...
Wrote backups/adepa-2026-01-15_022034.sql.gz (~12.4KB)
  ↑ Uploaded to Google Drive (id: 1xyz...)
```

Check the Drive folder — you should see the `.sql.gz` file appear.

## 6. The daily cron picks it up automatically

`routes/console.php` already schedules `adepa:backup` at 02:00 daily. Once env vars are set, every nightly backup gets uploaded.

---

## Restore from a backup

1. Download the `.sql.gz` from Drive
2. Gunzip locally: `gunzip adepa-2026-01-15_022034.sql.gz`
3. Import in hPanel → phpMyAdmin → Import → choose the `.sql` file → Go

---

## Troubleshooting

**`Drive upload failed — see laravel.log`**
- Check `storage/logs/laravel.log` for the actual error
- Most common: 404 means the folder ID is wrong or the service account wasn't shared on the folder

**`File not found: storage/app/google-drive-key.json`**
- The path is **relative to the laravel root**, not absolute
- Verify with `ls storage/app/google-drive-key.json`

**`Permission denied` on the JSON file**
- Re-run `chmod 600 storage/app/google-drive-key.json`

**Quota**
- Google Drive's free tier is 15GB, shared across the service account's parent organisation. A nightly `.sql.gz` is typically <100KB so the 30-day retention sits at <3MB — plenty of room.
