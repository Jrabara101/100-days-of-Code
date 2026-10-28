<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorLedgerEntry extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false; // Only uses created_at

    protected $fillable = [
        'vendor_id',
        'sub_order_id',
        'type',
        'amount_cents',
        'balance_bucket',
        'stripe_transfer_id',
        'description',
        'created_at',
    ];

    protected $casts = [
        'amount_cents' => 'integer',
        'created_at' => 'datetime',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function subOrder(): BelongsTo
    {
        return $this->belongsTo(SubOrder::class);
    }
}
