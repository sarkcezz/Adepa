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
    'google_drive' => [
        // Path (relative to laravel root) to the service-account JSON key.
        // e.g. storage/app/google-drive-key.json
        'key_file'  => env('GOOGLE_DRIVE_KEY_FILE'),
        // Drive folder ID (the long token in the folder's URL).
        'folder_id' => env('GOOGLE_DRIVE_FOLDER_ID'),
        // How many days of backups to retain on Drive (local keeps 7).
        'keep_days' => (int) env('GOOGLE_DRIVE_KEEP_DAYS', 30),
    ],
];
