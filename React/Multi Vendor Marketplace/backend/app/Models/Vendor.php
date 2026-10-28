<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vendor extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'shop_name',
        'slug',
        'logo_url',
        'banner_url',
        'story_bio',
        'origin_country',
        'origin_city',
        'commission_rate_bps',
        'free_shipping_threshold_cents',
        'flat_shipping_rate_cents',
        'avg_ship_hours',
        'on_time_ship_pct',
        'response_time_text',
        'rating_avg',
        'reviews_count',
        'stripe_connect_account_id',
        'is_vacation_mode',
        'vacation_return_date',
        'status',
        'tier',
        'escrow_balance_cents',
        'available_balance_cents',
    ];

    protected $casts = [
        'is_vacation_mode' => 'boolean',
        'commission_rate_bps' => 'integer',
        'free_shipping_threshold_cents' => 'integer',
        'flat_shipping_rate_cents' => 'integer',
        'avg_ship_hours' => 'integer',
        'on_time_ship_pct' => 'float',
        'rating_avg' => 'float',
        'reviews_count' => 'integer',
        'escrow_balance_cents' => 'integer',
        'available_balance_cents' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function subOrders(): HasMany
    {
        return $this->hasMany(SubOrder::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(VendorLedgerEntry::class);
    }

    /**
     * Helper to compute net payout waterfall for a given retail price in cents.
     */
    public function computeWaterfall(int $grossCents, bool $isDirectReferral = false): array
    {
        $bps = $isDirectReferral ? 0 : $this->commission_rate_bps;
        $commissionCents = (int) round(($grossCents * $bps) / 10000);
        $gatewayFeeCents = $grossCents > 0 ? (int) round($grossCents * 0.029) + 30 : 0;
        $netPayoutCents = max(0, $grossCents - $commissionCents - $gatewayFeeCents);

        return [
            'gross_cents' => $grossCents,
            'commission_bps' => $bps,
            'commission_cents' => $commissionCents,
            'gateway_fee_cents' => $gatewayFeeCents,
            'net_payout_cents' => $netPayoutCents,
        ];
    }
}
