<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function summary(): array
    {
        $today  = today();
        $month  = $today->copy()->startOfMonth();

        return [
            'total_revenue_kobo'  => (int) Order::where('payment_status', 'PAID')->sum('total_kobo'),
            'orders_today'        => Order::whereDate('created_at', $today)->count(),
            'orders_this_month'   => Order::where('created_at', '>=', $month)->count(),
            'total_customers'     => User::where('role', 'customer')->count(),
            'active_products'     => Product::where('is_active', true)->count(),
            'pending_orders'      => Order::where('status', 'PENDING')->count(),
            'low_stock_products'  => Product::where('is_active', true)->where('stock_qty', '<', 10)->count(),
            'orders_by_status'    => Order::select('status', DB::raw('count(*) as count'))
                                          ->groupBy('status')->pluck('count', 'status'),
        ];
    }

    public function revenue(string $period = 'daily', ?string $from = null, ?string $to = null): array
    {
        $from = $from ? Carbon::parse($from) : now()->subDays(30);
        $to   = $to   ? Carbon::parse($to)   : now();

        $format = match ($period) {
            'monthly' => '%Y-%m',
            'weekly'  => '%x-W%v',
            default   => '%Y-%m-%d',
        };

        $rows = Order::where('payment_status', 'PAID')
            ->whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw("DATE_FORMAT(created_at, '$format') as label"),
                DB::raw('SUM(total_kobo) as revenue_kobo'),
                DB::raw('COUNT(*) as order_count')
            )
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return $rows->toArray();
    }

    public function topProducts(int $limit = 5): array
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.payment_status', 'PAID')
            ->select(
                'order_items.product_id',
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as qty_sold'),
                DB::raw('SUM(order_items.subtotal_kobo) as revenue_kobo')
            )
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('revenue_kobo')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function employeePerformance(): array
    {
        return Order::where('source', 'EMPLOYEE_SALE')
            ->whereNotNull('employee_id')
            ->join('users', 'users.id', '=', 'orders.employee_id')
            ->select(
                'users.id',
                'users.name',
                'users.employee_id as emp_code',
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(orders.total_kobo) as revenue_kobo')
            )
            ->groupBy('users.id', 'users.name', 'users.employee_id')
            ->orderByDesc('revenue_kobo')
            ->get()
            ->toArray();
    }

    public function campaignPerformance(): array
    {
        return Campaign::withCount('usages')
            ->with(['usages' => fn($q) => $q->select('campaign_id', DB::raw('SUM(discount_applied_kobo) as total'))->groupBy('campaign_id')])
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'code'           => $c->code,
                'usage_count'    => $c->usage_count,
                'discount_kobo'  => (int) ($c->usages->sum('total') ?? 0),
                'is_active'      => $c->is_active,
            ])
            ->toArray();
    }

    public function topCustomers(int $limit = 10): array
    {
        return Order::where('payment_status', 'PAID')
            ->join('users', 'users.id', '=', 'orders.customer_id')
            ->select(
                'users.id',
                'users.name',
                'users.phone',
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(orders.total_kobo) as spend_kobo')
            )
            ->groupBy('users.id', 'users.name', 'users.phone')
            ->orderByDesc('spend_kobo')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
