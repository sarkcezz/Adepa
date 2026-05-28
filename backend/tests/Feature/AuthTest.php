<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'     => 'Test Customer',
            'email'    => 'tester@example.com',
            'phone'    => '+233244000099',
            'password' => 'StrongPass123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'token']);
        $this->assertDatabaseHas('users', ['email' => 'tester@example.com', 'role' => 'customer']);
    }

    public function test_login_fails_for_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'user@example.com',
            'password' => Hash::make('correct-password'),
            'role'     => 'customer',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'user@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_login_succeeds_with_correct_credentials(): void
    {
        $user = User::factory()->create([
            'email'    => 'user2@example.com',
            'password' => Hash::make('correct-password'),
            'role'     => 'customer',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'user2@example.com',
            'password' => 'correct-password',
        ])->assertOk()
          ->assertJsonPath('user.id', $user->id);
    }

    public function test_force_password_change_locks_out_other_endpoints(): void
    {
        $user = User::factory()->create([
            'role'                  => 'customer',
            'password'              => Hash::make('temp123!'),
            'force_password_change' => true,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        // Listing orders should be blocked by password.changed middleware
        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/orders/my')
            ->assertStatus(423)
            ->assertJsonPath('force_password_change', true);

        // /auth/me should still work
        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/auth/me')
            ->assertOk();
    }

    public function test_change_password_clears_force_flag(): void
    {
        $user = User::factory()->create([
            'password'              => Hash::make('temp123!'),
            'force_password_change' => true,
        ]);
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/auth/change-password', [
                'current_password'              => 'temp123!',
                'new_password'                  => 'NewStrongPass99',
                'new_password_confirmation'     => 'NewStrongPass99',
            ])->assertOk();

        $this->assertFalse($user->fresh()->force_password_change);
    }
}
