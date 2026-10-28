<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'sub_order_id',
        'vendor_id',
        'issue_type',
        'resolution_type',
        'refund_amount_cents',
        'status',
        'notes',
    ];

    protected $casts = [
        'refund_amount_cents' => 'integer',
    ];

    public function subOrder(): BelongsTo
    {
        return $this->belongsTo(SubOrder::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
