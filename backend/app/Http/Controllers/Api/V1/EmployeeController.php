<?php

namespace App\Http\Controllers\Api\V1;

use App\Jobs\SendEmployeeWelcomeSms;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::where('role', 'employee')->orderBy('employee_id')->paginate(30)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => ['required', 'string'],
            'phone' => ['required', 'string', 'unique:users,phone'],
            'email' => ['nullable', 'email', 'unique:users,email'],
        ]);

        $tempPassword = Str::random(10);

        $emp = User::create([
            'name'        => $data['name'],
            'phone'       => $data['phone'],
            'email'       => $data['email'] ?? null,
            'password'    => Hash::make($tempPassword),
            'role'        => 'employee',
            'employee_id' => User::nextEmployeeId(),
            'is_active'   => true,
            'force_password_change' => true,
        ]);

        SendEmployeeWelcomeSms::dispatch($emp->id, $tempPassword);

        return response()->json([
            'employee'     => $emp,
            'temp_password' => $tempPassword,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $emp = User::where('role', 'employee')->findOrFail($id);
        $data = $request->validate([
            'name'  => ['sometimes', 'string'],
            'phone' => ['sometimes', 'string'],
            'email' => ['nullable', 'email'],
        ]);
        $emp->update($data);
        return response()->json($emp);
    }

    public function setStatus(Request $request, string $id): JsonResponse
    {
        $emp = User::where('role', 'employee')->findOrFail($id);
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $emp->update(['is_active' => $data['is_active']]);
        return response()->json($emp);
    }

    public function resetPassword(string $id): JsonResponse
    {
        $emp = User::where('role', 'employee')->findOrFail($id);
        $temp = Str::random(10);
        $emp->update(['password' => Hash::make($temp), 'force_password_change' => true]);
        SendEmployeeWelcomeSms::dispatch($emp->id, $temp);
        return response()->json(['temp_password' => $temp]);
    }

    public function sales(string $id): JsonResponse
    {
        $orders = Order::where('employee_id', $id)
            ->where('source', 'EMPLOYEE_SALE')
            ->orderByDesc('created_at')
            ->paginate(30);
        return response()->json($orders);
    }
}
