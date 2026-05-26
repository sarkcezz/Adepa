<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@adepaporkhub.com')],
            [
                'name'     => env('ADMIN_NAME', 'Adepa Admin'),
                'phone'    => env('ADMIN_PHONE', '0200000001'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'ChangeMe@2025!')),
                'role'     => 'admin',
                'is_active' => true,
            ]
        );
    }
}
