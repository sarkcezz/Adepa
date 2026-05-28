<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'id'                    => (string) Str::uuid(),
            'name'                  => fake()->name(),
            'email'                 => fake()->unique()->safeEmail(),
            'phone'                 => '+2332' . fake()->numerify('########'),
            'password'              => Hash::make('password'),
            'role'                  => 'customer',
            'is_active'             => true,
            'force_password_change' => false,
        ];
    }
}
