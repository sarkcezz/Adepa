<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

class CampaignUsage extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'campaign_id', 'order_id', 'customer_id',
        'discount_applied_kobo', 'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($m) {
            $m->created_at ??= now();
        });
    }
}
