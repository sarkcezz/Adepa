<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

class PorkEvent extends Model
{
    use HasUuid;

    protected $fillable = [
        'name', 'event_date', 'event_time', 'venue_name', 'venue_address',
        'flat_rate_kobo', 'capacity', 'registered_count', 'description',
        'image_url', 'status', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'event_date'      => 'date',
            'flat_rate_kobo'  => 'integer',
            'capacity'        => 'integer',
            'registered_count' => 'integer',
        ];
    }

    public function scopeUpcoming($q)
    {
        return $q->where('status', 'PUBLISHED')
            ->whereDate('event_date', '>=', now()->toDateString())
            ->orderBy('event_date');
    }

    public function registrations()
    {
        return $this->hasMany(EventRegistration::class, 'event_id');
    }

    public function getSlotsRemainingAttribute(): int
    {
        return max(0, $this->capacity - $this->registered_count);
    }
}
