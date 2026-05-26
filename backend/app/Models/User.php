<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasUuid, Notifiable;

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'role',
        'employee_id', 'is_active', 'force_password_change',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'force_password_change' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function employeeOrders()
    {
        return $this->hasMany(Order::class, 'employee_id');
    }

    public function eventRegistrations()
    {
        return $this->hasMany(EventRegistration::class, 'customer_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public static function nextEmployeeId(): string
    {
        $last = static::whereNotNull('employee_id')
            ->orderByDesc('employee_id')
            ->value('employee_id');

        $next = $last ? ((int) substr($last, 4)) + 1 : 1;

        return 'APH-' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
