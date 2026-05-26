<?php

return [
    'default' => env('MAIL_MAILER', 'smtp'),
    'mailers' => [
        'smtp' => [
            'transport'  => 'smtp',
            'url'        => env('MAIL_URL'),
            'host'       => env('MAIL_HOST', 'smtp.sendgrid.net'),
            'port'       => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username'   => env('MAIL_USERNAME'),
            'password'   => env('MAIL_PASSWORD'),
            'timeout'    => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN'),
        ],
        'log' => ['transport' => 'log'],
    ],
    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'orders@adepaporkhub.shop'),
        'name'    => env('MAIL_FROM_NAME', 'Adepa Pork Hub'),
    ],
];
