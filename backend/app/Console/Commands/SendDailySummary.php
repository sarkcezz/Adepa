<?php

namespace App\Console\Commands;

use App\Mail\DailySummaryMail;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Daily summary email — runs at 22:00 local time, includes:
 *  · Sales count + revenue (today vs. yesterday for comparison)
 *  · Top 5 products by units sold
 *  · Top 3 employees by revenue
 *  · Low-stock count
 *  · Pending-order count
 */
class SendDailySummary extends Command
{
    protected $signature = 'adepa:daily-summary {--date= : Override the report date (YYYY-MM-DD)}';
    protected $description = 'Email admin a snapshot of yesterday\'s trading.';

    public function handle(): int
    {
        $date = $this->option('date') ? \Illuminate\Support\Carbon::parse($this->option('date')) : today();
        $prev = (clone $date)->subDay();

        // ── Today's numbers ────────────────────────────────────────────
        $today = $this->dayStats($date);
        $yesterday = $this->dayStats($prev);

        // ── Top products by units (today) ──────────────────────────────
        $topProducts = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereDate('orders.created_at', $date)
            ->where('orders.payment_status', 'PAID')
            ->select('order_items.product_name', DB::raw('SUM(order_items.quantity) as qty'),
                     DB::raw('SUM(order_items.subtotal_kobo) as revenue_kobo'))
            ->groupBy('order_items.product_name')
            ->orderByDesc('qty')
            ->limit(5)
            ->get();

        // ── Top employees ──────────────────────────────────────────────
        $topEmployees = Order::query()
            ->join('users', 'users.id', '=', 'orders.employee_id')
            ->whereDate('orders.created_at', $date)
            ->where('orders.source', 'EMPLOYEE_SALE')
            ->select('users.name', 'users.employee_id',
                     DB::raw('COUNT(*) as orders'),
                     DB::raw('SUM(orders.total_kobo) as revenue_kobo'))
            ->groupBy('users.id', 'users.name', 'users.employee_id')
            ->orderByDesc('revenue_kobo')
            ->limit(3)
            ->get();

        // ── Operational health ─────────────────────────────────────────
        $lowStockCount = Product::where('is_active', true)->where('stock_qty', '<', 5)->count();
        $pendingCount  = Order::where('status', 'PENDING')->count();

        // ── Send ───────────────────────────────────────────────────────
        $recipients = User::where('role', 'admin')->where('is_active', true)->pluck('email')->filter()->values();
        if ($recipients->isEmpty()) {
            $this->warn('No admin email — skipping daily summary.');
            return self::SUCCESS;
        }

        Mail::to($recipients->all())->queue(new DailySummaryMail(
            date:          $date,
            today:         $today,
            yesterday:     $yesterday,
            topProducts:   $topProducts,
            topEmployees:  $topEmployees,
            lowStockCount: $lowStockCount,
            pendingCount:  $pendingCount,
        ));

        $this->info("Daily summary queued to {$recipients->count()} admin(s).");
        return self::SUCCESS;
    }

    protected function dayStats(\Illuminate\Support\Carbon $date): array
    {
        return [
            'sales_count'    => Order::whereDate('created_at', $date)->where('payment_status', 'PAID')->count(),
            'revenue_kobo'   => (int) Order::whereDate('created_at', $date)->where('payment_status', 'PAID')->sum('total_kobo'),
            'avg_order_kobo' => (int) Order::whereDate('created_at', $date)->where('payment_status', 'PAID')->avg('total_kobo'),
        ];
    }
}
