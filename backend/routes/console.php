<?php

use Illuminate\Support\Facades\Schedule;

// ── Queue worker ──────────────────────────────────────────────────────
// Drain queued jobs every minute — triggered by Hostinger cron:
//   * * * * * php ~/laravel/artisan schedule:run >> /dev/null 2>&1
Schedule::command('queue:work --stop-when-empty --tries=3 --timeout=50')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

// ── Token cleanup ─────────────────────────────────────────────────────
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// ── Phase 1 — operational schedule ────────────────────────────────────

// Database backup at 02:00 local time (low traffic). Keeps last 7 days.
Schedule::command('adepa:backup --keep=7')
    ->dailyAt('02:00')
    ->withoutOverlapping();

// Low-stock alert at 08:00 — in the admin's inbox with morning coffee.
Schedule::command('adepa:low-stock --threshold=5')
    ->dailyAt('08:00');

// End-of-day summary at 22:00 — covers the full trading day.
Schedule::command('adepa:daily-summary')
    ->dailyAt('22:00');
