<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScanSession extends Model
{
    protected $fillable = [
        'base_url',
        'status',
        'depth',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function linkResults(): HasMany
    {
        return $this->hasMany(LinkResult::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Computed Attributes
    |--------------------------------------------------------------------------
    */

    /**
     * Total number of links scanned in this session.
     */
    public function getTotalLinksAttribute(): int
    {
        return $this->linkResults()->count();
    }

    /**
     * Number of broken links found.
     */
    public function getBrokenCountAttribute(): int
    {
        return $this->linkResults()->where('is_broken', true)->count();
    }

    /**
     * Number of successful links (2xx).
     */
    public function getValidCountAttribute(): int
    {
        return $this->linkResults()
            ->whereBetween('status_code', [200, 299])
            ->count();
    }

    /**
     * Number of redirected links (3xx).
     */
    public function getRedirectCountAttribute(): int
    {
        return $this->linkResults()
            ->whereBetween('status_code', [300, 399])
            ->count();
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}
