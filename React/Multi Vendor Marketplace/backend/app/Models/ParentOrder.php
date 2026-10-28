<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParentOrder extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_number',
        'buyer_id',
        'buyer_name',
        'buyer_email',
        'currency',
        'items_subtotal_cents',
        'shipping_total_cents',
        'tax_total_cents',
        'discount_total_cents',
        'grand_total_cents',
        'payment_gateway',
        'payment_intent_id',
        'payment_status',
        'shipping_address',
        'paid_at',
    ];

    protected $casts = [
        'items_subtotal_cents' => 'integer',
        'shipping_total_cents' => 'integer',
        'tax_total_cents' => 'integer',
        'discount_total_cents' => 'integer',
        'grand_total_cents' => 'integer',
        'shipping_address' => 'array',
        'paid_at' => 'datetime',
    ];

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function subOrders(): HasMany
    {
        return $this->hasMany(SubOrder::class);
    }
}
