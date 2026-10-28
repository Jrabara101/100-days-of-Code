<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoopCampaign extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'slug',
        'discount_pct',
        'marketplace_subsidy_pct',
        'vendor_contribution_pct',
        'status',
        'end_date',
    ];

    protected $casts = [
        'discount_pct' => 'integer',
        'marketplace_subsidy_pct' => 'integer',
        'vendor_contribution_pct' => 'integer',
    ];
}
