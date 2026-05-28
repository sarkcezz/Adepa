<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [
    'default'    => env('LOG_CHANNEL', 'stack'),
    'deprecations' => ['channel' => 'null', 'trace' => false],
    'channels'   => [
        // Stack now writes to the daily channel — auto-rotates so
        // storage/logs/laravel.log doesn't fill Hostinger's quota.
        'stack' => [
            'driver'  => 'stack',
            'channels' => ['daily'],
            'ignore_exceptions' => false,
        ],
        'single' => [
            'driver' => 'single',
            'path'   => storage_path('logs/laravel.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],
        'daily' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/laravel.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'days'   => 30,
            'replace_placeholders' => true,
        ],
        'null'   => ['driver' => 'monolog', 'handler' => NullHandler::class],
        'emergency' => ['path' => storage_path('logs/laravel.log')],
    ],
];
