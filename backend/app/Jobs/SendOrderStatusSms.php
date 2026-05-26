<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\HubtelSmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendOrderStatusSms implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(public string $orderId, public string $status) {}

    public function handle(HubtelSmsService $sms): void
    {
        $order = Order::with('customer')->find($this->orderId);
        if (! $order || ! $order->customer?->phone) {
            return;
        }

        $message = match ($this->status) {
            'CONFIRMED'        => "Adepa Pork Hub: Order {$order->order_number} confirmed. We'll start preparing it shortly.",
            'PREPARING'        => "Adepa Pork Hub: Order {$order->order_number} is being prepared. Get ready!",
            'OUT_FOR_DELIVERY' => "Adepa Pork Hub: Order {$order->order_number} is on its way to you.",
            'DELIVERED'        => "Adepa Pork Hub: Order {$order->order_number} delivered. Enjoy your meal!",
            'CANCELLED'        => "Adepa Pork Hub: Order {$order->order_number} has been cancelled. Reach out if this was unexpected.",
            default            => "Adepa Pork Hub: Order {$order->order_number} status: {$this->status}",
        };

        $sms->send($order->customer->phone, $message);
    }
}
