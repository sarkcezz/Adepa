<?php

namespace App\Services;

use App\Jobs\SendOrderConfirmationEmail;
use App\Jobs\SendOrderStatusSms;
use App\Models\Campaign;
use App\Models\CampaignUsage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(protected CampaignService $campaignService) {}

    public function createOnlineOrder(array $payload, string $customerId): Order
    {
        // Retry once on order_number collision (see createEmployeeSale).
        $attempts = 0;
        retry:
        $attempts++;
        try {
            return $this->doCreateOnlineOrder($payload, $customerId);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            if ($attempts < 3 && str_contains($e->getMessage(), 'order_number')) {
                usleep(50_000);
                goto retry;
            }
            throw $e;
        }
    }

    protected function doCreateOnlineOrder(array $payload, string $customerId): Order
    {
        return DB::transaction(function () use ($payload, $customerId) {
            $items   = $this->resolveItems($payload['items']);
            $subtotal = collect($items)->sum('line_total');

            $deliveryFee = $payload['delivery_method'] === 'HOME' ? 1500 : 0;
            $discount    = 0;
            $campaignId  = null;
            $freeDelivery = false;

            if (! empty($payload['promo_code'])) {
                $lines = collect($items)->pluck('product')->pluck('product_line')->unique()->toArray();
                $check = $this->campaignService->validate($payload['promo_code'], $subtotal, $lines);
                if ($check['valid']) {
                    $discount     = $check['discount_kobo'];
                    $campaignId   = $check['campaign_id'];
                    $freeDelivery = $check['free_delivery'];
                }
            }

            if ($freeDelivery) {
                $deliveryFee = 0;
            }

            $total = max(0, $subtotal + $deliveryFee - $discount);

            $order = Order::create([
                'order_number'       => Order::generateOrderNumber(),
                'customer_id'        => $customerId,
                'status'             => 'PENDING',
                'delivery_method'    => $payload['delivery_method'],
                'address_id'         => $payload['address_id'] ?? null,
                'pickup_location_name' => $payload['pickup_location_name'] ?? null,
                'subtotal_kobo'      => $subtotal,
                'delivery_fee_kobo'  => $deliveryFee,
                'discount_kobo'      => $discount,
                'total_kobo'         => $total,
                'payment_method'     => $payload['payment_method'] ?? 'MOMO',
                'paystack_reference' => $payload['paystack_reference'] ?? null,
                'payment_status'     => 'PENDING',
                'source'             => 'ONLINE',
                'campaign_id'        => $campaignId,
                'notes'              => $payload['notes'] ?? null,
            ]);

            foreach ($items as $row) {
                /** @var Product $product */
                $product = $row['product'];
                OrderItem::create([
                    'order_id'        => $order->id,
                    'product_id'      => $product->id,
                    'product_name'    => $product->name,
                    'product_variant' => $product->variant,
                    'weight_grams'    => $product->weight_grams,
                    'quantity'        => $row['quantity'],
                    'unit_price_kobo' => $product->price_kobo,
                    'subtotal_kobo'   => $row['line_total'],
                ]);

                // Decrement stock atomically (clamped at 0 so a race condition
                // can't make stock_qty go negative).
                Product::where('id', $product->id)
                    ->update([
                        'stock_qty' => DB::raw("GREATEST(stock_qty - {$row['quantity']}, 0)"),
                    ]);
            }

            if ($campaignId && $discount > 0) {
                Campaign::where('id', $campaignId)->increment('usage_count');
                CampaignUsage::create([
                    'campaign_id'           => $campaignId,
                    'order_id'              => $order->id,
                    'customer_id'           => $customerId,
                    'discount_applied_kobo' => $discount,
                ]);
            }

            OrderStatusHistory::create([
                'order_id'   => $order->id,
                'status'     => 'PENDING',
                'changed_by' => $customerId,
                'note'       => 'Order placed.',
            ]);

            return $order->fresh(['items', 'statusHistory']);
        });
    }

    public function createEmployeeSale(array $payload, string $employeeId): Order
    {
        // Retry once if the order_number collides with a concurrent insert.
        // Beyond two attempts something is structurally wrong — let it bubble.
        $attempts = 0;
        retry:
        $attempts++;
        try {
            return $this->doCreateEmployeeSale($payload, $employeeId);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            if ($attempts < 3 && str_contains($e->getMessage(), 'order_number')) {
                usleep(50_000); // 50ms backoff before re-querying MAX
                goto retry;
            }
            throw $e;
        }
    }

    protected function doCreateEmployeeSale(array $payload, string $employeeId): Order
    {
        return DB::transaction(function () use ($payload, $employeeId) {
            // resolveItems now respects per-line discounts so we can show
            // savings on the receipt and still send the correct totals to
            // payments / accounting.
            $items    = $this->resolveItems($payload['items']);
            $subtotal = collect($items)->sum('line_total');
            $lineDiscountTotal = collect($items)->sum('line_discount');
            $orderDiscount = 0;
            $campaignId = null;

            if (! empty($payload['promo_code'])) {
                $check = $this->campaignService->validate($payload['promo_code'], $subtotal);
                if ($check['valid']) {
                    $orderDiscount = $check['discount_kobo'];
                    $campaignId    = $check['campaign_id'];
                }
            }

            $total = max(0, $subtotal - $orderDiscount);

            $order = Order::create([
                'order_number'    => Order::generateOrderNumber(),
                'customer_id'     => $payload['customer_id'] ?? $employeeId,
                'employee_id'     => $employeeId,
                'status'          => 'DELIVERED',
                'delivery_method' => 'PICKUP',
                'pickup_location_name' => $payload['stand_name'] ?? 'In-person sale',
                'subtotal_kobo'   => $subtotal,
                'delivery_fee_kobo' => 0,
                // discount_kobo on the order = order-level promo + sum of line discounts
                // so the receipt total = subtotal - discount is consistent.
                'discount_kobo'   => $orderDiscount + $lineDiscountTotal,
                'total_kobo'      => $total,
                'payment_method'  => $payload['payment_method'] ?? 'CASH',
                'payment_reference' => $payload['payment_reference'] ?? null,
                // Stash client_reference here too for offline idempotency lookup.
                'paystack_reference' => $payload['client_reference'] ?? null,
                'payment_status'  => 'PAID',
                'source'          => 'EMPLOYEE_SALE',
                'campaign_id'     => $campaignId,
                'notes'           => $payload['customer_phone'] ?? null,
            ]);

            foreach ($items as $row) {
                $product = $row['product'];
                OrderItem::create([
                    'order_id'        => $order->id,
                    'product_id'      => $product->id,
                    'product_name'    => $product->name,
                    'product_variant' => $product->variant,
                    'weight_grams'    => $product->weight_grams,
                    'quantity'        => $row['quantity'],
                    'unit_price_kobo' => $product->price_kobo,
                    // subtotal stored is POST line-discount so totals add up.
                    'subtotal_kobo'   => $row['line_total'],
                ]);

                // Decrement stock atomically. EMPLOYEE_SALE is always "PAID"
                // so we deduct immediately. GREATEST() guards against drift.
                Product::where('id', $product->id)
                    ->update([
                        'stock_qty' => DB::raw("GREATEST(stock_qty - {$row['quantity']}, 0)"),
                    ]);
            }

            OrderStatusHistory::create([
                'order_id'   => $order->id,
                'status'     => 'DELIVERED',
                'changed_by' => $employeeId,
                'note'       => $lineDiscountTotal > 0
                    ? "In-person sale recorded with line discounts: -" . number_format($lineDiscountTotal / 100, 2) . " GHS"
                    : 'In-person sale recorded.',
            ]);

            return $order->fresh('items');
        });
    }

    public function updateStatus(Order $order, string $status, ?string $changedBy = null, ?string $note = null): Order
    {
        $order->update(['status' => $status]);

        OrderStatusHistory::create([
            'order_id'   => $order->id,
            'status'     => $status,
            'changed_by' => $changedBy,
            'note'       => $note,
        ]);

        if ($order->customer && $order->customer->phone) {
            SendOrderStatusSms::dispatch($order->id, $status);
        }

        if (in_array($status, ['CONFIRMED', 'DELIVERED'])) {
            SendOrderConfirmationEmail::dispatch($order->id);
        }

        return $order->fresh('statusHistory');
    }

    protected function resolveItems(array $items): array
    {
        $resolved = [];
        foreach ($items as $item) {
            $product       = Product::active()->findOrFail($item['product_id']);
            $qty           = max(1, (int) ($item['quantity'] ?? 1));
            $gross         = $product->price_kobo * $qty;
            $lineDiscount  = max(0, min($gross, (int) ($item['line_discount_kobo'] ?? 0)));

            $resolved[] = [
                'product'       => $product,
                'quantity'      => $qty,
                'line_discount' => $lineDiscount,
                'line_total'    => $gross - $lineDiscount,
            ];
        }
        return $resolved;
    }
}
