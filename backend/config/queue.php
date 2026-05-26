<?php

return [
    'default' => env('QUEUE_CONNECTION', 'database'),
    'connections' => [
        'sync'     => ['driver' => 'sync'],
        'database' => [
            'driver'        => 'database',
            'table'         => 'jobs',
            'queue'         => 'default',
            'retry_after'   => 90,
            'after_commit'  => false,
        ],
    ],
    'batching' => [
        'database' => 'mysql',
        'table'    => 'job_batches',
    ],
    'failed' => [
        'driver'   => 'database-uuids',
        'database' => 'mysql',
        'table'    => 'failed_jobs',
    ],
];
