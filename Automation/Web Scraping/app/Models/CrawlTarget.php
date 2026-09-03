<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrawlTarget extends Model
{
    protected $guarded = [];

    protected $casts = [
        'last_crawled_at' => 'datetime',
    ];

    public function records(): HasMany
    {
        return $this->hasMany(ScrapedRecord::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(CrawlRun::class);
    }
}
