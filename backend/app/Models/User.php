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
        'employee_id', 'position', 'is_active', 'force_password_change',
    ];

    /** Employee position hierarchy — higher number = more privileges. */
    public const POSITION_RANKS = [
        'cashier'    => 1,
        'stand_lead' => 2,
        'supervisor' => 3,
        'manager'    => 4,
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

    /** Does this user (an employee) have at least the given position? */
    public function hasPosition(string $minimum): bool
    {
        // Admin gets everything regardless.
        if ($this->role === 'admin') return true;

        $userRank = self::POSITION_RANKS[$this->position ?? 'cashier'] ?? 0;
        $minRank  = self::POSITION_RANKS[$minimum] ?? 0;

        return $userRank >= $minRank;
    }

    /**
     * Permission check used by middleware and any server-side gate.
     * Named hasPermission() (not can()) because Laravel's Authorizable
     * trait already defines can() with an incompatible signature —
     * overriding it would be a fatal type error.
     */
    public function hasPermission(string $ability): bool
    {
        return match ($ability) {
            'sell'             => $this->isEmployee() || $this->isAdmin(),
            'apply_discount'   => $this->hasPosition('stand_lead'),
            'hold_cart'        => $this->hasPosition('stand_lead'),
            'void_sale'        => $this->hasPosition('supervisor'),
            'refund_sale'      => $this->hasPosition('supervisor'),
            'manage_employees' => $this->isAdmin(),
            'view_all_sales'   => $this->isAdmin() || $this->hasPosition('manager'),
            default            => false,
        };
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
