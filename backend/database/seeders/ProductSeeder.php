<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $sets = [
            ['line' => 'RAW',    'variant' => 'PLAIN', 'name' => 'Plain Pork Cuts',     'desc' => 'Fresh plain pork cuts, butcher-clean and ready to cook.',     'heat' => 0,
             'rows' => [[200, 9], [500, 21], [1000, 40], [2000, 78], [5000, 185], [10000, 360]]],
            ['line' => 'SPICED', 'variant' => 'MILD',  'name' => 'Mild Seasoned Pork',  'desc' => 'Premium pork marinated in our signature mild spice blend.',   'heat' => 1,
             'rows' => [[200, 10], [500, 23], [1000, 46], [2000, 88], [5000, 210], [10000, 400]]],
            ['line' => 'SPICED', 'variant' => 'SPICY', 'name' => 'Spicy Seasoned Pork', 'desc' => 'Bold Ghanaian pork seasoned with fiery chilli and spices.',   'heat' => 3,
             'rows' => [[200, 11], [500, 25], [1000, 50], [2000, 96], [5000, 230], [10000, 440]]],
        ];

        foreach ($sets as $set) {
            foreach ($set['rows'] as [$grams, $ghs]) {
                Product::updateOrCreate(
                    ['name' => $set['name'], 'weight_grams' => $grams, 'variant' => $set['variant']],
                    [
                        'product_line' => $set['line'],
                        'price_kobo'   => $ghs * 100,
                        'description'  => $set['desc'],
                        'ingredients'  => 'Premium Ghanaian pork',
                        'storage_instructions' => 'Keep refrigerated at 0–4°C. Consume within 2 days of purchase.',
                        'heat_level'   => $set['heat'],
                        'stock_qty'    => 60,
                        'is_active'    => true,
                    ]
                );
            }
        }

        $rte = [
            ['Single Serving', null,  20, 2, 'Grilled or fried pork — freshly prepared and ready to eat.'],
            ['Lunch Box',      null,  35, 2, 'Juicy pork served with rice and Adepa signature sauce.'],
            ['Family Pack',    800,   90, 2, 'Generous grilled pork platter — feeds a family of 4.'],
            ['Event Pack',     null, 240, 2, 'Bulk grilled pork 3–5 kg. Perfect for events and parties.'],
            ['Pork Soup',      null,  24, 2, 'Richly spiced pork broth — 500 ml, warming and hearty.'],
            ['Mixed Box',      null,  62, 2, 'Grilled + fried + soup sampler. The full Adepa experience.'],
        ];

        foreach ($rte as [$name, $grams, $ghs, $heat, $desc]) {
            Product::updateOrCreate(
                ['name' => $name, 'product_line' => 'READY_TO_EAT'],
                [
                    'variant'      => 'NONE',
                    'weight_grams' => $grams,
                    'price_kobo'   => $ghs * 100,
                    'description'  => $desc,
                    'storage_instructions' => 'Best enjoyed fresh. Refrigerate any leftovers.',
                    'heat_level'   => $heat,
                    'stock_qty'    => 30,
                    'is_active'    => true,
                ]
            );
        }
    }
}
