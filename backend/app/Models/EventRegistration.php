<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    use HasUuid;

    protected $fillable = [
        'event_id', 'customer_id', 'payment_status',
        'paystack_reference', 'checked_in', 'checked_in_at',
    ];

    protected function casts(): array
    {
        return [
            'checked_in'    => 'boolean',
            'checked_in_at' => 'datetime',
        ];
    }

    public function event()
    {
        return $this->belongsTo(PorkEvent::class, 'event_id');
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
