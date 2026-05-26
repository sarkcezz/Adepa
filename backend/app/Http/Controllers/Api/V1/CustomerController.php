<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = User::where('role', 'customer');
        if ($search = $request->input('q')) {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                   ->orWhere('phone', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%");
            });
        }
        return response()->json($q->orderBy('name')->paginate(30));
    }

    public function show(string $id): JsonResponse
    {
        $customer = User::where('role', 'customer')->findOrFail($id);
        $orders   = Order::where('customer_id', $id)->orderByDesc('created_at')->get();
        $spend    = (int) $orders->where('payment_status', 'PAID')->sum('total_kobo');

        return response()->json([
            'customer'    => $customer,
            'orders'      => $orders,
            'total_spend_kobo' => $spend,
        ]);
    }
}
