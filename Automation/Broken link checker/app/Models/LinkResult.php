<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LinkResult extends Model
{
    protected $fillable = [
        'scan_session_id',
        'url',
        'source_page',
        'status_code',
        'final_url',
        'error_message',
        'is_broken',
        'is_external',
        'checked_at',
    ];

    protected $casts = [
        'is_broken'   => 'boolean',
        'is_external' => 'boolean',
        'checked_at'  => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function scanSession(): BelongsTo
    {
        return $this->belongsTo(ScanSession::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeBroken($query)
    {
        return $query->where('is_broken', true);
    }

    public function scopeRedirected($query)
    {
        return $query->whereBetween('status_code', [300, 399]);
    }

    public function scopeValid($query)
    {
        return $query->whereBetween('status_code', [200, 299]);
    }

    public function scopeExternal($query)
    {
        return $query->where('is_external', true);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Human-readable status category.
     */
    public function getStatusCategoryAttribute(): string
    {
        if ($this->error_message && ! $this->status_code) {
            return 'error';
        }

        return match (true) {
            $this->status_code >= 200 && $this->status_code < 300 => 'valid',
            $this->status_code >= 300 && $this->status_code < 400 => 'redirect',
            $this->status_code >= 400 && $this->status_code < 600 => 'broken',
            default                                                 => 'unknown',
        };
    }
}
