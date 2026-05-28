<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Order;
use App\Services\AuditService;
use App\Services\OrderService;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use League\Csv\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected PaystackService $paystack,
    ) {}

    public function mine(Request $request): JsonResponse
    {
        $orders = Order::with('items')
            ->where('customer_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(20);
        return response()->json($orders);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $order = Order::with(['items', 'statusHistory', 'address', 'event'])
            ->findOrFail($id);

        $user = $request->user();
        abort_unless($user->isAdmin() || $order->customer_id === $user->id || $order->employee_id === $user->id, 403);

        return response()->json($order);
    }

    public function status(Request $request, string $id): JsonResponse
    {
        $order = Order::select('id', 'customer_id', 'status', 'updated_at')
            ->with(['statusHistory:id,order_id,status,note,created_at'])
            ->findOrFail($id);

        $user = $request->user();
        abort_unless($user->isAdmin() || $order->customer_id === $user->id, 403);

        return response()->json([
            'id'         => $order->id,
            'status'     => $order->status,
            'updated_at' => $order->updated_at,
            'history'    => $order->statusHistory,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items'                => ['required', 'array', 'min:1'],
            'items.*.product_id'   => ['required', 'string', 'exists:products,id'],
            'items.*.quantity'     => ['required', 'integer', 'min:1'],
            'delivery_method'      => ['required', 'in:HOME,PICKUP,EVENT'],
            'address_id'           => ['nullable', 'string', 'exists:addresses,id'],
            'pickup_location_name' => ['nullable', 'string'],
            'payment_method'       => ['required', 'in:MOMO,CARD,CASH,BANK'],
            'paystack_reference'   => ['nullable', 'string'],
            'promo_code'           => ['nullable', 'string'],
            'notes'                => ['nullable', 'string'],
        ]);

        if (! empty($data['paystack_reference'])) {
            $verify = $this->paystack->verifyTransaction($data['paystack_reference']);
            if (! $this->paystack->isSuccessful($verify)) {
                return response()->json(['message' => 'Payment verification failed.'], 422);
            }
        }

        $order = $this->orderService->createOnlineOrder($data, $request->user()->id);

        if (! empty($data['paystack_reference'])) {
            $order->update(['payment_status' => 'PAID']);
            $this->orderService->updateStatus($order, 'CONFIRMED', $request->user()->id, 'Payment confirmed.');
        }

        return response()->json($order->fresh(['items', 'statusHistory']), 201);
    }

    public function employeeSale(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items'                       => ['required', 'array', 'min:1'],
            'items.*.product_id'          => ['required', 'string', 'exists:products,id'],
            'items.*.quantity'            => ['required', 'integer', 'min:1'],
            'items.*.line_discount_kobo'  => ['nullable', 'integer', 'min:0'],
            'customer_id'                 => ['nullable', 'string', 'exists:users,id'],
            'customer_phone'              => ['nullable', 'string'],
            'payment_method'              => ['required', 'in:CASH,MOMO,CARD'],
            'payment_reference'           => ['nullable', 'string'],
            'stand_name'                  => ['nullable', 'string'],
            'promo_code'                  => ['nullable', 'string'],
            // Idempotency key — supplied by offline queue to prevent dupes
            // when a sale is replayed after a network blip.
            'client_reference'            => ['nullable', 'string', 'max:64'],
        ]);

        // Idempotency check — if this client_reference was already saved,
        // return the existing order instead of creating a duplicate.
        if (!empty($data['client_reference'])) {
            $existing = Order::where('employee_id', $request->user()->id)
                ->where('source', 'EMPLOYEE_SALE')
                ->where('paystack_reference', $data['client_reference'])
                ->first();
            if ($existing) {
                return response()->json($existing->load('items'), 200);
            }
        }

        $order = $this->orderService->createEmployeeSale($data, $request->user()->id);
        return response()->json($order, 201);
    }

    /**
     * Look up a customer by phone for the POS — used to auto-fill the
     * cart's customer info when an existing customer rings up a sale.
     */
    public function customerLookup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'min:6'],
        ]);

        $phone = preg_replace('/\s+/', '', $data['phone']);

        $customer = \App\Models\User::where('role', 'customer')
            ->where(function ($q) use ($phone) {
                $q->where('phone', $phone)
                  ->orWhere('phone', 'like', '%' . substr($phone, -9));
            })
            ->select('id', 'name', 'email', 'phone')
            ->first();

        return response()->json(['customer' => $customer]);
    }

    public function mySales(Request $request): JsonResponse
    {
        $orders = Order::where('employee_id', $request->user()->id)
            ->where('source', 'EMPLOYEE_SALE')
            ->orderByDesc('created_at')
            ->paginate(20);
        return response()->json($orders);
    }

    public function mySalesSummary(Request $request): JsonResponse
    {
        $eid = $request->user()->id;

        return response()->json([
            'today_count'     => Order::where('employee_id', $eid)->whereDate('created_at', today())->count(),
            'today_total'     => (int) Order::where('employee_id', $eid)->whereDate('created_at', today())->sum('total_kobo'),
            'week_total'      => (int) Order::where('employee_id', $eid)->where('created_at', '>=', now()->startOfWeek())->sum('total_kobo'),
            'month_total'     => (int) Order::where('employee_id', $eid)->where('created_at', '>=', now()->startOfMonth())->sum('total_kobo'),
        ]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $q = Order::with(['customer:id,name,phone', 'items'])->orderByDesc('created_at');

        if ($s = $request->input('status'))            { $q->where('status', $s); }
        if ($p = $request->input('payment_method'))    { $q->where('payment_method', $p); }
        if ($d = $request->input('delivery_method'))   { $q->where('delivery_method', $d); }
        if ($from = $request->input('from'))           { $q->whereDate('created_at', '>=', $from); }
        if ($to   = $request->input('to'))             { $q->whereDate('created_at', '<=', $to); }

        return response()->json($q->paginate(30));
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:PENDING,CONFIRMED,PREPARING,OUT_FOR_DELIVERY,DELIVERED,CANCELLED'],
            'note'   => ['nullable', 'string'],
        ]);

        $order  = Order::findOrFail($id);
        $before = $order->status;
        $order  = $this->orderService->updateStatus($order, $data['status'], $request->user()->id, $data['note'] ?? null);

        AuditService::log('order.status_changed', $order, [
            'from' => $before,
            'to'   => $data['status'],
            'note' => $data['note'] ?? null,
        ]);

        return response()->json($order->fresh('statusHistory'));
    }

    public function bulkStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['string', 'exists:orders,id'],
            'status' => ['required', 'in:PENDING,CONFIRMED,PREPARING,OUT_FOR_DELIVERY,DELIVERED,CANCELLED'],
        ]);

        $updated = 0;
        foreach (Order::whereIn('id', $data['ids'])->get() as $order) {
            $this->orderService->updateStatus($order, $data['status'], $request->user()->id, 'Bulk update');
            $updated++;
        }

        AuditService::log('order.bulk_status_changed', null, [
            'count'  => $updated,
            'status' => $data['status'],
            'ids'    => $data['ids'],
        ]);

        return response()->json(['updated' => $updated]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filename = 'orders-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($request) {
            $csv = Writer::createFromStream(fopen('php://output', 'w'));
            $csv->insertOne([
                'Order #', 'Date', 'Customer', 'Phone', 'Status', 'Payment',
                'Delivery', 'Subtotal (GHS)', 'Delivery (GHS)', 'Discount (GHS)', 'Total (GHS)',
            ]);

            Order::with('customer:id,name,phone')
                ->orderByDesc('created_at')
                ->chunk(500, function ($orders) use ($csv) {
                    foreach ($orders as $o) {
                        $csv->insertOne([
                            $o->order_number,
                            $o->created_at->toDateTimeString(),
                            $o->customer->name ?? '—',
                            $o->customer->phone ?? '—',
                            $o->status,
                            $o->payment_status,
                            $o->delivery_method,
                            number_format($o->subtotal_kobo / 100, 2),
                            number_format($o->delivery_fee_kobo / 100, 2),
                            number_format($o->discount_kobo / 100, 2),
                            number_format($o->total_kobo / 100, 2),
                        ]);
                    }
                });
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
