<?php

namespace Database\Seeders;

use App\Models\StandAnnouncement;
use App\Models\User;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        if (! $admin) return;

        StandAnnouncement::updateOrCreate(
            ['title' => 'Stand Locations — This Week'],
            [
                'description' => 'Find us at your nearest Adepa Pork Hub stand. Fresh cuts and ready-to-eat available!',
                'locations'   => [
                    ['name' => 'Accra Central Market Stand',  'area' => 'Accra Central', 'days' => 'Mon–Sat',     'hours' => '07:00–18:00', 'map_link' => 'https://maps.google.com/?q=Accra+Central+Market'],
                    ['name' => 'Tema Community 5 Stand',      'area' => 'Tema',          'days' => 'Tue, Thu, Sat','hours' => '08:00–17:00', 'map_link' => 'https://maps.google.com/?q=Tema+Community+5'],
                    ['name' => 'Kumasi Kejetia Market Stand', 'area' => 'Kumasi',        'days' => 'Mon–Fri',     'hours' => '07:00–16:00', 'map_link' => 'https://maps.google.com/?q=Kejetia+Market+Kumasi'],
                ],
                'start_date'   => now()->toDateString(),
                'end_date'     => now()->addDays(6)->toDateString(),
                'is_published' => true,
                'created_by'   => $admin->id,
            ]
        );
    }
}
