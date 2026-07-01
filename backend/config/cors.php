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
    // Vercel preview/production deployments (frontend rebuild) — the URL
    // changes per deploy, so match the domain rather than pin one host.
    'allowed_origins_patterns' => [
        '#^https://[a-z0-9-]+\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400,
    // false because we authenticate with `Authorization: Bearer ...`
    // not cookies. Setting credentials true forces the browser to
    // require a specific Allow-Origin (not '*') and adds CORS friction.
    'supports_credentials' => false,
];
