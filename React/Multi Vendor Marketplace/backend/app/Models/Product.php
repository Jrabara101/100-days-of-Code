<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'vendor_id',
        'category',
        'title',
        'slug',
        'description',
        'images',
        'status',
        'rating_avg',
        'reviews_count',
        'provenance_badge',
        'is_add_on',
        'dimensional_reviews',
    ];

    protected $casts = [
        'images' => 'array',
        'dimensional_reviews' => 'array',
        'rating_avg' => 'float',
        'reviews_count' => 'integer',
        'is_add_on' => 'boolean',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }
}
