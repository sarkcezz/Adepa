<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

class OrderStatusHistory extends Model
{
    use HasUuid;

    protected $table = 'order_status_history';
    public $timestamps = false;

    protected $fillable = [
        'order_id', 'status', 'changed_by', 'note', 'created_at',
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
