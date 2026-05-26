<?php

return [
    'mailgun' => [],
    'postmark' => [],
    'ses'      => [],
    'paystack' => [
        'secret' => env('PAYSTACK_SECRET_KEY'),
        'public' => env('PAYSTACK_PUBLIC_KEY'),
    ],
];
