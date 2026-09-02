<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScrapedRecord extends Model
{
    protected $guarded = [];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function target(): BelongsTo
    {
        return $this->belongsTo(CrawlTarget::class, 'crawl_target_id');
    }

    protected function canonicalUrl(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => $attributes['canonical_url'] ?? null,
            set: fn ($value) => ['canonical_url' => $value],
        );
    }

    protected function numericValueCents(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => (int) ($attributes['numeric_value_cents'] ?? 0),
            set: fn ($value) => ['numeric_value_cents' => (int) $value],
        );
    }
}
