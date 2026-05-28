<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cannot_access_admin_endpoints(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $token    = $customer->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/products')
            ->assertForbidden();
    }

    public function test_employee_cannot_access_admin_endpoints(): void
    {
        $employee = User::factory()->create([
            'role'        => 'employee',
            'employee_id' => 'APH-9001',
            'position'    => 'cashier',
        ]);
        $token = $employee->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/employees')
            ->assertForbidden();
    }

    public function test_employee_can_access_own_sales_endpoint(): void
    {
        $employee = User::factory()->create([
            'role'        => 'employee',
            'employee_id' => 'APH-9002',
        ]);
        $token = $employee->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/orders/my-sales')
            ->assertOk();
    }

    public function test_admin_can_access_admin_endpoints(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/employees')
            ->assertOk();
    }

    public function test_deactivated_user_is_rejected_even_with_valid_token(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => false]);
        $token = $admin->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/admin/employees')
            ->assertForbidden();
    }

    public function test_orders_id_route_only_matches_uuid_format(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('t')->plainTextToken;

        // "my-sales" should fall through to the specific route, not crash show()
        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/orders/my-sales')
            ->assertOk();
    }
}
