<?php

return [
    'default' => env('FILESYSTEM_DISK', 'local'),
    'disks'   => [
        'local' => [
            'driver' => 'local',
            'root'   => storage_path('app/private'),
            'serve'  => true,
            'throw'  => false,
        ],
        'public' => [
            'driver'     => 'local',
            'root'       => storage_path('app/public'),
            'url'        => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw'      => false,
        ],
        // Backblaze B2 — S3-compatible. Used for off-site database backups.
        // Pulls credentials from .env (see docs/BACKBLAZE_BACKUP.md).
        'b2' => [
            'driver'                  => 's3',
            'key'                     => env('B2_KEY_ID'),
            'secret'                  => env('B2_APPLICATION_KEY'),
            'region'                  => env('B2_REGION', 'us-west-002'),
            'bucket'                  => env('B2_BUCKET'),
            'endpoint'                => env('B2_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'throw'                   => true,
        ],
    ],
    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],
];
