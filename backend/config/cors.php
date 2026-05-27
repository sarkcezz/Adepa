<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'https://adepaporkhub.shop',
        'https://www.adepaporkhub.shop',
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400,
    // false because we authenticate with `Authorization: Bearer ...`
    // not cookies. Setting credentials true forces the browser to
    // require a specific Allow-Origin (not '*') and adds CORS friction.
    'supports_credentials' => false,
];
