<?php

namespace App\Http\Controllers\Api\V1;

use App\Jobs\SendEmployeeWelcomeSms;
use App\Models\Order;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
            'name'     => ['required', 'string'],
            'phone'    => ['required', 'string', 'unique:users,phone'],
            'email'    => ['nullable', 'email', 'unique:users,email'],
            'position' => ['nullable', Rule::in(array_keys(User::POSITION_RANKS))],
        ]);

        $tempPassword = Str::random(10);

        $emp = User::create([
            'name'        => $data['name'],
            'phone'       => $data['phone'],
            'email'       => $data['email'] ?? null,
            'password'    => Hash::make($tempPassword),
            'role'        => 'employee',
            'employee_id' => User::nextEmployeeId(),
            'position'    => $data['position'] ?? 'cashier',
            'is_active'   => true,
            'force_password_change' => true,
        ]);

        SendEmployeeWelcomeSms::dispatch($emp->id, $tempPassword);

        AuditService::log('employee.created', $emp, ['position' => $emp->position]);

        return response()->json([
            'employee'      => $emp,
            'temp_password' => $tempPassword,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $emp = User::where('role', 'employee')->findOrFail($id);
        $data = $request->validate([
            'name'     => ['sometimes', 'string'],
            'phone'    => ['sometimes', 'string'],
            'email'    => ['nullable', 'email'],
            'position' => ['nullable', Rule::in(array_keys(User::POSITION_RANKS))],
        ]);

        $before = $emp->only(array_keys($data));
        $emp->update($data);

        AuditService::log('employee.updated', $emp, [
            'before' => $before,
            'after'  => $emp->only(array_keys($data)),
        ]);

        return response()->json($emp);
    }

    public function setStatus(Request $request, string $id): JsonResponse
    {
        $emp = User::where('role', 'employee')->findOrFail($id);
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $emp->update(['is_active' => $data['is_active']]);

        AuditService::log(
            $data['is_active'] ? 'employee.activated' : 'employee.deactivated',
            $emp,
        );

        return response()->json($emp);
    }

    /**
     * Admin resets an employee's password. The temp password is generated
     * server-side, hashed and stored, and returned ONCE to the admin so
     * they can read/share it. force_password_change is set so the employee
     * must update it on next login.
     */
    public function resetPassword(string $id): JsonResponse
    {
        $emp = User::where('role', 'employee')->findOrFail($id);

        // Memorable-but-secure: "Adepa-Pork-XXXX" with 4 alphanumerics
        $suffix = strtoupper(Str::random(4));
        $temp   = "Adepa-Pork-{$suffix}";

        $emp->update([
            'password'              => Hash::make($temp),
            'force_password_change' => true,
        ]);

        // Revoke all existing Sanctum tokens — old sessions can't outlive a reset.
        $emp->tokens()->delete();

        // Also push it over SMS so the employee gets it even if admin loses it
        SendEmployeeWelcomeSms::dispatch($emp->id, $temp);

        AuditService::log('employee.password_reset', $emp);

        return response()->json([
            'temp_password' => $temp,
            'sent_via_sms'  => true,
        ]);
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
