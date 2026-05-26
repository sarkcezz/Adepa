<?php

return [
    'client_id'     => env('HUBTEL_CLIENT_ID'),
    'client_secret' => env('HUBTEL_CLIENT_SECRET'),
    'sender_id'     => env('HUBTEL_SENDER_ID', 'AdepaPork'),
    'base_url'      => env('HUBTEL_BASE_URL', 'https://sms.hubtel.com/v1/messages'),
];
