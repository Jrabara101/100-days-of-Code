<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DispatchEvent extends Model
{
    protected $guarded = [];

    protected $casts = [
        'context_payload' => 'array',
    ];

    public function dispatches(): HasMany
    {
        return $this->hasMany(DispatchOutbox::class);
    }
}
