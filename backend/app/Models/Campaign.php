<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasUuid;

    protected $fillable = [
        'name', 'code', 'discount_type', 'discount_value',
        'min_order_kobo', 'max_usage', 'usage_count',
        'valid_from', 'valid_to', 'applicable_lines', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'valid_from'       => 'datetime',
            'valid_to'         => 'datetime',
            'applicable_lines' => 'array',
            'is_active'        => 'boolean',
            'discount_value'   => 'integer',
            'min_order_kobo'   => 'integer',
        ];
    }

    public function usages()
    {
        return $this->hasMany(CampaignUsage::class);
    }
}
