# Uptime monitoring — setup

The backend now exposes a health endpoint at `/up` (Laravel 11 default).
It returns `200 OK` with a JSON body when the app is responsive and an
error code otherwise.

Use any free uptime monitor to ping it every 5 minutes and alert you
when the site goes down.

## Option A — UptimeRobot (recommended, 50 monitors free)

1. Sign up at **https://uptimerobot.com** (free, no card)
2. **Dashboard → + Add New Monitor**
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Adepa API`
   - **URL**: `https://api.adepaporkhub.shop/up`
   - **Monitoring Interval**: 5 minutes (free tier minimum)
4. Under **Notifications**, add your email and/or phone number
5. **Create Monitor**

Repeat for the frontend:
- **Friendly Name**: `Adepa frontend`
- **URL**: `https://adepaporkhub.shop`

You'll get an email if either is unreachable for 2 consecutive checks
(about 10 minutes).

## Option B — BetterStack (nicer alerts, 10 monitors free)

1. Sign up at **https://betterstack.com**
2. **Heartbeats / Uptime → New Monitor**
3. Same URLs as above
4. Configure Slack / SMS / phone-call escalations if you want

## What `/up` actually checks

Laravel's built-in health endpoint:
- Verifies the framework booted
- Returns 200 + `{"name":"Laravel","status":"OK"}`

It does NOT check database connectivity. For most outages the framework
itself fails to boot (PHP error, missing config, file-permission issue)
so the basic check catches it. If you want DB checks too, replace the
default with a custom controller — but for now the simple version covers
~95% of real outages.

## Manual test

```bash
curl -i https://api.adepaporkhub.shop/up
```

Should return:
```
HTTP/2 200
content-type: application/json
{"name":"Laravel","status":"OK"}
```
