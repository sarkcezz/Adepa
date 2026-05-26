<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasUuid;

    protected $fillable = [
        'name', 'product_line', 'variant', 'weight_grams',
        'price_kobo', 'description', 'ingredients',
        'storage_instructions', 'heat_level', 'image_url',
        'stock_qty', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_kobo'   => 'integer',
            'weight_grams' => 'integer',
            'stock_qty'    => 'integer',
            'heat_level'   => 'integer',
            'is_active'    => 'boolean',
        ];
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }

    public function getPriceGhsAttribute(): float
    {
        return $this->price_kobo / 100;
    }
}
