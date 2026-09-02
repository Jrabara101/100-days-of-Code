<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrawlRun extends Model
{
    protected $guarded = [];

    public function target(): BelongsTo
    {
        return $this->belongsTo(CrawlTarget::class, 'crawl_target_id');
    }
}
