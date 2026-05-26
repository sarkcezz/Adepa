<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackService
{
    protected string $base;
    protected string $secret;

    public function __construct()
    {
        $this->base   = rtrim(config('paystack.base_url'), '/');
        $this->secret = config('paystack.secret_key', '');
    }

    public function initializeTransaction(string $email, int $amountKobo, string $reference, array $metadata = []): array
    {
        $res = Http::withToken($this->secret)
            ->acceptJson()
            ->post("{$this->base}/transaction/initialize", [
                'email'        => $email,
                'amount'       => $amountKobo,
                'reference'    => $reference,
                'currency'     => config('paystack.currency', 'GHS'),
                'callback_url' => env('FRONTEND_URL') . '/dashboard/orders',
                'metadata'     => $metadata,
            ]);

        if (! $res->ok()) {
            Log::warning('Paystack init failed', ['body' => $res->body()]);
            throw new \RuntimeException('Paystack initialization failed.');
        }

        return $res->json();
    }

    public function verifyTransaction(string $reference): array
    {
        $res = Http::withToken($this->secret)
            ->acceptJson()
            ->get("{$this->base}/transaction/verify/" . urlencode($reference));

        if (! $res->ok()) {
            Log::warning('Paystack verify failed', ['ref' => $reference, 'body' => $res->body()]);
            throw new \RuntimeException('Paystack verification failed.');
        }

        return $res->json();
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $expected = hash_hmac('sha512', $payload, $this->secret);
        return hash_equals($expected, $signature);
    }

    public function isSuccessful(array $verifyResponse): bool
    {
        return ($verifyResponse['status'] ?? false) === true
            && ($verifyResponse['data']['status'] ?? null) === 'success';
    }
}
