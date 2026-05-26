<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            EmployeeSeeder::class,
            CustomerSeeder::class,
            ProductSeeder::class,
            AnnouncementSeeder::class,
            EventSeeder::class,
            CampaignSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
