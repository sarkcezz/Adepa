<?php

return [
    'name'      => env('APP_NAME', 'Adepa Pork Hub'),
    'env'       => env('APP_ENV', 'production'),
    'debug'     => (bool) env('APP_DEBUG', false),
    'url'       => env('APP_URL', 'http://localhost'),
    'timezone'  => env('APP_TIMEZONE', 'Africa/Accra'),
    'locale'    => 'en',
    'fallback_locale' => 'en',
    'faker_locale'    => 'en_GB',
    'cipher'    => 'AES-256-CBC',
    'key'       => env('APP_KEY'),
    'previous_keys' => [],
    'maintenance' => [
        'driver' => 'file',
    ],
    'providers' => \Illuminate\Support\ServiceProvider::defaultProviders()->merge([
        App\Providers\AppServiceProvider::class,
    ])->toArray(),
];
