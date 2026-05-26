<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $products  = Product::where('is_active', true)->get();
        if ($customers->isEmpty() || $products->isEmpty()) return;

        $statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

        for ($i = 1; $i <= 10; $i++) {
            $customer = $customers->random();
            $status   = $statuses[array_rand($statuses)];

            $order = Order::create([
                'order_number'   => 'APH-' . str_pad((string) $i, 6, '0', STR_PAD_LEFT),
                'customer_id'    => $customer->id,
                'status'         => $status,
                'delivery_method' => 'HOME',
                'subtotal_kobo'  => 0,
                'total_kobo'     => 0,
                'payment_method' => 'MOMO',
                'payment_status' => $status === 'CANCELLED' ? 'FAILED' : 'PAID',
                'source'         => 'ONLINE',
                'created_at'     => now()->subDays(rand(0, 30)),
            ]);

            $subtotal = 0;
            $items    = $products->random(rand(1, 4));
            foreach ($items as $product) {
                $qty = rand(1, 3);
                $line = $product->price_kobo * $qty;
                $subtotal += $line;
                OrderItem::create([
                    'order_id'        => $order->id,
                    'product_id'      => $product->id,
                    'product_name'    => $product->name,
                    'product_variant' => $product->variant,
                    'weight_grams'    => $product->weight_grams,
                    'quantity'        => $qty,
                    'unit_price_kobo' => $product->price_kobo,
                    'subtotal_kobo'   => $line,
                ]);
            }

            $deliveryFee = 1500;
            $order->update([
                'subtotal_kobo'     => $subtotal,
                'delivery_fee_kobo' => $deliveryFee,
                'total_kobo'        => $subtotal + $deliveryFee,
            ]);

            OrderStatusHistory::create([
                'id'        => (string) Str::uuid(),
                'order_id'  => $order->id,
                'status'    => $status,
                'note'      => 'Seed data',
            ]);
        }
    }
}
