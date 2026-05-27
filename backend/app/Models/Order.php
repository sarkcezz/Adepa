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

    /**
     * Generate the next sequential order number (APH-NNNNNN).
     *
     * Bug fix: previously sorted by created_at which doesn't track the
     * sequence — older orders could have higher numbers from seeders or
     * data backfills, breaking the unique constraint on the next insert.
     * Now we extract the numeric portion and take MAX(...) directly.
     *
     * Concurrent inserts can still collide; createEmployeeSale and
     * createOnlineOrder wrap the insert in a retry loop to handle that.
     */
    public static function generateOrderNumber(): string
    {
        $max = static::query()
            ->where('order_number', 'like', 'APH-%')
            ->selectRaw('MAX(CAST(SUBSTRING(order_number, 5) AS UNSIGNED)) as max_num')
            ->value('max_num');

        $next = ((int) $max) + 1;
        return 'APH-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
