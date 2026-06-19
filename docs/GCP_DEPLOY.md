# Deploying Adepa to Google Cloud (Cloud Run + Cloud SQL)

Target topology:

| Component | Service | Domain |
|---|---|---|
| Next.js frontend | Cloud Run (`adepa-web`) | `adepaporkhub.shop`, `www.` |
| Laravel API | Cloud Run (`adepa-api`) | `api.adepaporkhub.shop` |
| MySQL 8 | Cloud SQL | private |
| Images | Cloudinary | unchanged |
| Payments | Paystack | unchanged |
| Queue + cron | Cloud Run Jobs + Cloud Scheduler | — |

Both services scale to zero. The recurring cost is Cloud SQL (~$10–25/mo).

---

## 0. Prerequisites

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
export PROJECT_ID=$(gcloud config get-value project)
export REGION=europe-west1     # pick one close to Ghana; eu-west1 or eu-west2
```

Enable the APIs:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com
```

Create an Artifact Registry repo for the images:

```bash
gcloud artifacts repositories create adepa \
  --repository-format=docker --location=$REGION
```

---

## 1. Cloud SQL (MySQL)

```bash
gcloud sql instances create adepa-db \
  --database-version=MYSQL_8_0 --tier=db-f1-micro \
  --region=$REGION --storage-size=10GB --storage-auto-increase

gcloud sql databases create adepa --instance=adepa-db
gcloud sql users create adepa_user --instance=adepa-db --password='STRONG_PASSWORD_HERE'

# Note the instance connection name (PROJECT:REGION:adepa-db):
export SQL_CONN=$(gcloud sql instances describe adepa-db --format='value(connectionName)')
echo $SQL_CONN
```

### Migrate data from Hostinger

1. Export the current DB. The app already has a pure-PHP dumper — on Hostinger:
   ```bash
   php artisan adepa:backup --no-upload
   # writes storage/app/private/backups/adepa-*.sql.gz
   ```
   Download and gunzip it. (Or use phpMyAdmin → Export.)
2. Import into Cloud SQL:
   ```bash
   gcloud sql connect adepa-db --user=adepa_user < adepa-YYYY-MM-DD.sql
   ```
   (For large files, upload to a GCS bucket and use `gcloud sql import sql`.)

---

## 2. Secrets

Store sensitive values in Secret Manager (never in the image):

```bash
printf 'base64:YOUR_APP_KEY' | gcloud secrets create APP_KEY --data-file=-
printf 'STRONG_PASSWORD_HERE' | gcloud secrets create DB_PASSWORD --data-file=-
printf 'sk_live_xxx'          | gcloud secrets create PAYSTACK_SECRET --data-file=-
printf 'your_cloud_secret'    | gcloud secrets create CLOUDINARY_API_SECRET --data-file=-
printf 'your_sendgrid_key'    | gcloud secrets create MAIL_PASSWORD --data-file=-
# ...repeat for Hubtel etc.
```

(Generate `APP_KEY` locally with `php artisan key:generate --show`.)

---

## 3. Deploy the Laravel API

Build and push:

```bash
cd backend
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/adepa/api
```

Deploy, wiring Cloud SQL + env + secrets:

```bash
gcloud run deploy adepa-api \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/adepa/api \
  --region $REGION --allow-unauthenticated \
  --add-cloudsql-instances $SQL_CONN \
  --set-env-vars "APP_ENV=production,APP_DEBUG=false,APP_URL=https://api.adepaporkhub.shop,FRONTEND_URL=https://adepaporkhub.shop,DB_CONNECTION=mysql,DB_SOCKET=/cloudsql/$SQL_CONN,DB_DATABASE=adepa,DB_USERNAME=adepa_user,CACHE_STORE=database,SESSION_DRIVER=database,QUEUE_CONNECTION=database,CLOUDINARY_CLOUD_NAME=YOURCLOUD,CLOUDINARY_API_KEY=YOURKEY,PAYSTACK_PUBLIC_KEY=pk_live_xxx,MAIL_MAILER=smtp,MAIL_HOST=smtp.sendgrid.net,MAIL_PORT=587,MAIL_USERNAME=apikey,MAIL_FROM_ADDRESS=orders@adepaporkhub.shop" \
  --set-secrets "APP_KEY=APP_KEY:latest,DB_PASSWORD=DB_PASSWORD:latest,PAYSTACK_SECRET_KEY=PAYSTACK_SECRET:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest,MAIL_PASSWORD=MAIL_PASSWORD:latest"
```

> Cloud SQL from Cloud Run uses the unix socket `/cloudsql/INSTANCE_CONN`. Laravel reads `DB_SOCKET` (set above) — confirm `config/database.php` mysql connection passes `unix_socket` from `env('DB_SOCKET')`. If not, add it.

Run migrations once (one-off execution):

```bash
gcloud run jobs create adepa-migrate \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/adepa/api \
  --region $REGION --add-cloudsql-instances $SQL_CONN \
  --set-env-vars "DB_CONNECTION=mysql,DB_SOCKET=/cloudsql/$SQL_CONN,DB_DATABASE=adepa,DB_USERNAME=adepa_user" \
  --set-secrets "APP_KEY=APP_KEY:latest,DB_PASSWORD=DB_PASSWORD:latest" \
  --command php --args artisan,migrate,--force
gcloud run jobs execute adepa-migrate --region $REGION
```

(Skip migrate if you imported the full Hostinger dump, which already has the schema.)

---

## 4. Deploy the Next.js frontend

`NEXT_PUBLIC_*` are build-time. Bake the API URL + Paystack public key in:

```bash
cd ../frontend-next
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/adepa/web \
  --substitutions=_API=https://api.adepaporkhub.shop/api/v1,_PK=pk_live_xxx \
  --config=- <<'YAML'
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - --build-arg=NEXT_PUBLIC_API_BASE_URL=${_API}
      - --build-arg=NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=${_PK}
      - -t=${_IMAGE}
      - .
    env: ['_IMAGE=${LOCATION}-docker.pkg.dev/${PROJECT_ID}/adepa/web']
images: ['${LOCATION}-docker.pkg.dev/${PROJECT_ID}/adepa/web']
YAML
```

> Simpler alternative: build locally and push —
> `docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.adepaporkhub.shop/api/v1 --build-arg NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx -t $REGION-docker.pkg.dev/$PROJECT_ID/adepa/web . && docker push ...`

Deploy:

```bash
gcloud run deploy adepa-web \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/adepa/web \
  --region $REGION --allow-unauthenticated
```

---

## 5. Custom domains + DNS

```bash
gcloud beta run domain-mappings create --service adepa-api --domain api.adepaporkhub.shop --region $REGION
gcloud beta run domain-mappings create --service adepa-web --domain adepaporkhub.shop   --region $REGION
gcloud beta run domain-mappings create --service adepa-web --domain www.adepaporkhub.shop --region $REGION
```

Each command prints the DNS records to add at your registrar (A/AAAA for the apex, CNAME `ghs.googlehosted.com` for `www` and `api`). Add them, wait for the managed TLS cert to provision (minutes to a few hours).

> This moves the domain off Hostinger. Keep Hostinger running until the new stack is verified, then cut DNS over.

---

## 6. Queue + scheduled jobs (replaces Hostinger cron)

Create Cloud Run Jobs for the recurring work, triggered by Cloud Scheduler:

```bash
# Queue worker — drains email/SMS jobs
gcloud run jobs create adepa-queue \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/adepa/api --region $REGION \
  --add-cloudsql-instances $SQL_CONN \
  --set-env-vars "DB_CONNECTION=mysql,DB_SOCKET=/cloudsql/$SQL_CONN,DB_DATABASE=adepa,DB_USERNAME=adepa_user,QUEUE_CONNECTION=database" \
  --set-secrets "APP_KEY=APP_KEY:latest,DB_PASSWORD=DB_PASSWORD:latest" \
  --command php --args artisan,queue:work,--stop-when-empty,--max-time=240

# Scheduler: run it every minute
gcloud scheduler jobs create http adepa-queue-tick --location $REGION \
  --schedule "* * * * *" \
  --uri "https://$REGION-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/adepa-queue:run" \
  --http-method POST --oauth-service-account-email YOUR_RUN_INVOKER_SA
```

Repeat for `adepa:backup` (02:00), `adepa:low-stock` (08:00), `adepa:daily-summary` (22:00) — each as a Job + Scheduler entry. The off-site backup already targets Backblaze B2 (see BACKBLAZE_BACKUP.md), independent of host.

---

## 7. Verify

```bash
curl -s https://api.adepaporkhub.shop/up                       # {"status":"ok"}
curl -s https://api.adepaporkhub.shop/api/v1/products | head   # JSON
open https://adepaporkhub.shop                                 # storefront loads
```

Then walk the flow: register → add to cart → checkout (Paystack test) → track order; admin login → dashboard; staff login → record a sale → receipt.

---

## 8. Optional: true real-time tracking

On Cloud Run (unlike Hostinger) long-lived connections work. To upgrade order tracking from 10s polling to push:

1. Add a Laravel SSE endpoint `GET /orders/{id}/stream` that emits status changes.
2. Swap the body of `frontend-next/lib/use-order-tracking.ts` to use `EventSource`. No consumer changes — the hook's return shape stays identical.

---

## CI/CD (optional)

Point a Cloud Build trigger at the `next-rebuild` branch: on push, build both images and `gcloud run deploy` each. Mirrors the GitHub Actions flow the Hostinger setup used.
