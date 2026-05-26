<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\EventRegistration;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        protected PaystackService $paystack,
        protected OrderService $orderService,
    ) {}

    public function webhook(Request $request): JsonResponse
    {
        $payload   = $request->getContent();
        $signature = $request->header('X-Paystack-Signature', '');

        if (! $this->paystack->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        $event = json_decode($payload, true) ?: [];
        $type  = $event['event'] ?? '';
        $data  = $event['data']  ?? [];
        $ref   = $data['reference'] ?? null;

        if (! $ref) {
            return response()->json(['received' => true]);
        }

        if ($type === 'charge.success') {
            $order = Order::where('paystack_reference', $ref)->first();
            if ($order && $order->payment_status !== 'PAID') {
                $order->update(['payment_status' => 'PAID']);
                $this->orderService->updateStatus($order, 'CONFIRMED', null, 'Payment confirmed via webhook.');
            }

            $reg = EventRegistration::where('paystack_reference', $ref)->first();
            if ($reg && $reg->payment_status !== 'PAID') {
                $reg->update(['payment_status' => 'PAID']);
                $reg->event()->increment('registered_count');
            }
        } elseif (in_array($type, ['charge.failed', 'charge.declined'])) {
            Order::where('paystack_reference', $ref)->update(['payment_status' => 'FAILED']);
            EventRegistration::where('paystack_reference', $ref)->update(['payment_status' => 'FAILED']);
        } else {
            Log::info('Paystack unhandled webhook event', ['type' => $type]);
        }

        return response()->json(['received' => true]);
    }
}
