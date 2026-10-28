<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubOrder extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'sub_order_number',
        'parent_order_id',
        'vendor_id',
        'shop_name_snapshot',
        'shop_origin_snapshot',
        'fulfillment_status',
        'referral_source',
        'gross_items_cents',
        'shipping_charged_cents',
        'tax_collected_cents',
        'platform_commission_bps',
        'platform_commission_cents',
        'gateway_fee_allocation_cents',
        'vendor_net_payout_cents',
        'escrow_status',
        'carrier_name',
        'tracking_number',
        'shipped_at',
        'delivered_at',
        'escrow_release_at',
        'resolution_note',
    ];

    protected $casts = [
        'gross_items_cents' => 'integer',
        'shipping_charged_cents' => 'integer',
        'tax_collected_cents' => 'integer',
        'platform_commission_bps' => 'integer',
        'platform_commission_cents' => 'integer',
        'gateway_fee_allocation_cents' => 'integer',
        'vendor_net_payout_cents' => 'integer',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'escrow_release_at' => 'datetime',
    ];

    public function parentOrder(): BelongsTo
    {
        return $this->belongsTo(ParentOrder::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SubOrderItem::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(VendorLedgerEntry::class);
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class);
    }
}
