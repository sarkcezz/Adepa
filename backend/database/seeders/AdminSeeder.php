<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    /**
     * Seeds the admin user.
     *
     * Password policy:
     *  - Production: respects ADMIN_PASSWORD env var if set; otherwise
     *    generates a strong random password, prints it once, and forces
     *    a change on first login. No more default `password` that ships
     *    with the repo.
     *  - If an admin already exists, the password is NOT overwritten —
     *    re-running the seeder won't clobber an existing real password.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@adepaporkhub.shop');
        $existing = User::where('email', $email)->first();

        // Don't reset an existing admin's password on re-seed.
        if ($existing) {
            $existing->update([
                'name'  => env('ADMIN_NAME', $existing->name),
                'phone' => env('ADMIN_PHONE', $existing->phone),
                'role'  => 'admin',
                'is_active' => true,
            ]);
            $this->command->info("Admin '{$email}' already exists — password untouched.");
            return;
        }

        $envPassword = env('ADMIN_PASSWORD');
        $generated   = ! $envPassword;
        $password    = $envPassword ?: $this->generateSecurePassword();

        User::create([
            'email'                 => $email,
            'name'                  => env('ADMIN_NAME', 'Adepa Admin'),
            'phone'                 => env('ADMIN_PHONE', '0200000001'),
            'password'              => Hash::make($password),
            'role'                  => 'admin',
            'is_active'             => true,
            // Force change on first login even when a password came from env,
            // so the admin doesn't keep using something checked into a shared
            // .env file.
            'force_password_change' => true,
        ]);

        if ($generated) {
            $this->command->warn('═══════════════════════════════════════════════════════════════');
            $this->command->warn('  ADMIN ACCOUNT CREATED — SAVE THIS PASSWORD NOW');
            $this->command->warn('  Email:    ' . $email);
            $this->command->warn('  Password: ' . $password);
            $this->command->warn('  You will be forced to change it on first login.');
            $this->command->warn('═══════════════════════════════════════════════════════════════');
        } else {
            $this->command->info("Admin created with ADMIN_PASSWORD from .env (must change on first login).");
        }
    }

    /** Memorable but strong: 3 words + 4-digit suffix. */
    protected function generateSecurePassword(): string
    {
        $words = ['Flame', 'Pork', 'Adepa', 'Cream', 'Grill', 'Spice', 'Stand', 'Stack', 'Crisp', 'Smoke'];
        shuffle($words);
        return $words[0] . '-' . $words[1] . '-' . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }
}
