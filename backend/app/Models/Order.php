<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasUuid;

    protected $fillable = [
        'order_number', 'customer_id', 'employee_id', 'status',
        'delivery_method', 'address_id', 'event_id', 'pickup_location_name',
        'subtotal_kobo', 'delivery_fee_kobo', 'discount_kobo', 'total_kobo',
        'payment_method', 'payment_reference', 'payment_status',
        'paystack_reference', 'source', 'campaign_id', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_kobo'     => 'integer',
            'delivery_fee_kobo' => 'integer',
            'discount_kobo'     => 'integer',
            'total_kobo'        => 'integer',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    public function event()
    {
        return $this->belongsTo(PorkEvent::class, 'event_id');
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at');
    }

    public static function generateOrderNumber(): string
    {
        $last = static::orderByDesc('created_at')->value('order_number');
        $next = $last ? ((int) substr($last, 4)) + 1 : 1;
        return 'APH-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
