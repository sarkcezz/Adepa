<?php

return [
    'secret_key' => env('PAYSTACK_SECRET_KEY'),
    'public_key' => env('PAYSTACK_PUBLIC_KEY'),
    'base_url'   => env('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
    'currency'   => 'GHS',
];
