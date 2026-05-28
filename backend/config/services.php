<?php

return [
    'mailgun'  => [],
    'postmark' => [],
    'ses'      => [],
    'paystack' => [
        'secret'     => env('PAYSTACK_SECRET_KEY'),
        'public'     => env('PAYSTACK_PUBLIC_KEY'),
        // Backwards-compat aliases referenced by older code paths
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
    ],
    'offsite_backup' => [
        // Which filesystem disk to use. Defaults to 'b2' (Backblaze) —
        // can be swapped for any S3-compatible disk in filesystems.php.
        'disk'      => env('OFFSITE_DISK', 'b2'),
        // How many days of backups to retain off-site (local keeps 7).
        'keep_days' => (int) env('OFFSITE_KEEP_DAYS', 30),
    ],
];
