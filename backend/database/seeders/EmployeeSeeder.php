<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [
            ['name' => 'Kwame Asante',  'email' => 'kwame@adepaporkhub.shop', 'phone' => '0244000001', 'employee_id' => 'APH-0001', 'position' => 'manager'],
            ['name' => 'Abena Mensah',  'email' => 'abena@adepaporkhub.shop', 'phone' => '0244000002', 'employee_id' => 'APH-0002', 'position' => 'cashier'],
        ];

        foreach ($employees as $emp) {
            User::updateOrCreate(
                ['phone' => $emp['phone']],
                [
                    'name'        => $emp['name'],
                    'email'       => $emp['email'],
                    'password'    => Hash::make('Employee@2025!'),
                    'role'        => 'employee',
                    'employee_id' => $emp['employee_id'],
                    'position'    => $emp['position'],
                    'is_active'   => true,
                    'force_password_change' => true,
                ]
            );
        }
    }
}
