<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['name' => 'Kofi Boateng',  'email' => 'kofi.boateng@gmail.com',   'phone' => '0244111001'],
            ['name' => 'Ama Owusu',     'email' => 'ama.owusu@gmail.com',      'phone' => '0244111002'],
            ['name' => 'Yaw Darko',     'email' => 'yaw.darko@gmail.com',      'phone' => '0244111003'],
            ['name' => 'Akosua Ampah',  'email' => 'akosua.ampah@gmail.com',   'phone' => '0244111004'],
            ['name' => 'Nana Adjei',    'email' => 'nana.adjei@gmail.com',     'phone' => '0244111005'],
        ];

        foreach ($customers as $c) {
            User::updateOrCreate(
                ['phone' => $c['phone']],
                [
                    'name'     => $c['name'],
                    'email'    => $c['email'],
                    'password' => Hash::make('Customer@2025!'),
                    'role'     => 'customer',
                    'is_active' => true,
                ]
            );
        }
    }
}
