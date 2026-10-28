<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubOrderItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'sub_order_id',
        'product_variant_id',
        'product_title_snapshot',
        'variant_title_snapshot',
        'quantity',
        'unit_price_cents',
        'line_total_cents',
        'image_url_snapshot',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_cents' => 'integer',
        'line_total_cents' => 'integer',
    ];

    public function subOrder(): BelongsTo
    {
        return $this->belongsTo(SubOrder::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
