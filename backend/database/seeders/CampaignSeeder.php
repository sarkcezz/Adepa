<?php

namespace Database\Seeders;

use App\Models\Campaign;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    public function run(): void
    {
        Campaign::updateOrCreate(
            ['code' => 'WELCOME10'],
            [
                'name'           => 'Welcome 10% Off',
                'discount_type'  => 'PERCENT',
                'discount_value' => 10,
                'min_order_kobo' => 20 * 100,
                'max_usage'      => 1000,
                'valid_from'     => now()->startOfYear(),
                'valid_to'       => now()->endOfYear(),
                'is_active'      => true,
            ]
        );

        Campaign::updateOrCreate(
            ['code' => 'FREESHIP'],
            [
                'name'           => 'Free Delivery Day',
                'discount_type'  => 'FREE_DELIVERY',
                'discount_value' => 0,
                'min_order_kobo' => 50 * 100,
                'valid_from'     => now()->startOfMonth(),
                'valid_to'       => now()->endOfMonth(),
                'is_active'      => true,
            ]
        );
    }
}
