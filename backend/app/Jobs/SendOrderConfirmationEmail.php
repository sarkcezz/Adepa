<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public string $orderId) {}

    public function handle(): void
    {
        $order = Order::with(['items', 'customer'])->find($this->orderId);
        if (! $order || ! $order->customer?->email) {
            return;
        }

        try {
            Mail::raw($this->body($order), function ($message) use ($order) {
                $message->to($order->customer->email)
                    ->subject("Adepa Pork Hub — Order {$order->order_number} update");
            });
        } catch (\Throwable $e) {
            Log::warning('Order email failed', ['order' => $order->id, 'err' => $e->getMessage()]);
        }
    }

    protected function body(Order $order): string
    {
        $lines = ["Hi {$order->customer->name},", "", "Your order {$order->order_number} is now: {$order->status}.", ""];
        $lines[] = "Items:";
        foreach ($order->items as $item) {
            $lines[] = "  • {$item->product_name} × {$item->quantity}  —  GHS " . number_format($item->subtotal_kobo / 100, 2);
        }
        $lines[] = "";
        $lines[] = "Subtotal:  GHS " . number_format($order->subtotal_kobo / 100, 2);
        if ($order->delivery_fee_kobo) $lines[] = "Delivery:  GHS " . number_format($order->delivery_fee_kobo / 100, 2);
        if ($order->discount_kobo)     $lines[] = "Discount:  GHS " . number_format($order->discount_kobo / 100, 2);
        $lines[] = "Total:     GHS " . number_format($order->total_kobo / 100, 2);
        $lines[] = "";
        $lines[] = "Track your order at " . env('FRONTEND_URL', '') . "/dashboard/orders/{$order->id}";
        $lines[] = "";
        $lines[] = "— Adepa Pork Hub";
        return implode("\n", $lines);
    }
}
