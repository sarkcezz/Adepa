<?php

use Illuminate\Support\Facades\Schedule;

// Drain queue every minute — triggered by Hostinger cron:
//   * * * * * php ~/laravel/artisan schedule:run >> /dev/null 2>&1
Schedule::command('queue:work --stop-when-empty --tries=3 --timeout=50')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

// Prune expired tokens daily
Schedule::command('sanctum:prune-expired --hours=24')->daily();
