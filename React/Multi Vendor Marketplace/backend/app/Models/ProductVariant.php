<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'product_id',
        'sku',
        'title',
        'attributes',
        'price_cents',
        'compare_at_price_cents',
        'stock_quantity',
        'reserved_quantity',
        'velocity_days_left',
        'weight_grams',
    ];

    protected $casts = [
        'attributes' => 'array',
        'price_cents' => 'integer',
        'compare_at_price_cents' => 'integer',
        'stock_quantity' => 'integer',
        'reserved_quantity' => 'integer',
        'velocity_days_left' => 'integer',
        'weight_grams' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function isAvailable(int $requestedQuantity = 1): bool
    {
        return ($this->stock_quantity - $this->reserved_quantity) >= $requestedQuantity;
    }
}
