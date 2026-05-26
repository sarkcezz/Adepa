<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HubtelSmsService
{
    public function send(string $to, string $message): bool
    {
        $clientId     = config('hubtel.client_id');
        $clientSecret = config('hubtel.client_secret');
        $senderId     = config('hubtel.sender_id');
        $base         = config('hubtel.base_url');

        if (! $clientId || ! $clientSecret) {
            Log::info('Hubtel not configured; SMS skipped', ['to' => $to]);
            return false;
        }

        $normalized = $this->normalize($to);

        $res = Http::withBasicAuth($clientId, $clientSecret)
            ->acceptJson()
            ->get($base, [
                'From'    => $senderId,
                'To'      => $normalized,
                'Content' => $message,
            ]);

        if (! $res->successful()) {
            Log::warning('Hubtel SMS failed', ['to' => $normalized, 'body' => $res->body()]);
            return false;
        }

        return true;
    }

    protected function normalize(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone);
        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            return '233' . substr($digits, 1);
        }
        if (str_starts_with($digits, '233')) {
            return $digits;
        }
        return $digits;
    }
}
