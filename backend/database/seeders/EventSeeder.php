<?php

namespace Database\Seeders;

use App\Models\PorkEvent;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        if (! $admin) return;

        PorkEvent::updateOrCreate(
            ['name' => 'Adepa Pork Night — Monthly Edition'],
            [
                'event_date'    => now()->addMonth()->toDateString(),
                'event_time'    => '18:00:00',
                'venue_name'    => 'La Palm Beach Hotel',
                'venue_address' => 'La Palm Beach Hotel, La Road, Accra, Ghana',
                'flat_rate_kobo' => 80 * 100,
                'capacity'      => 50,
                'description'   => 'Join us for an unforgettable evening of premium grilled pork, chilled drinks, and great vibes. Flat rate GHS 80 covers entry, pork platter, and one drink. Limited seats — book early!',
                'status'        => 'PUBLISHED',
                'created_by'    => $admin->id,
            ]
        );
    }
}
