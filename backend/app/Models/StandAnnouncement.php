<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

class StandAnnouncement extends Model
{
    use HasUuid;

    protected $fillable = [
        'title', 'description', 'locations',
        'start_date', 'end_date', 'is_published', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'locations'    => 'array',
            'start_date'   => 'date',
            'end_date'     => 'date',
            'is_published' => 'boolean',
        ];
    }

    public function scopeActive($q)
    {
        $today = now()->toDateString();
        return $q->where('is_published', true)
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date',   '>=', $today);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
