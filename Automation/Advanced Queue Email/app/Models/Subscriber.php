<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscriber extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_subscribed' => 'boolean',
        'last_bounced_at' => 'datetime',
    ];

    public function isDeliverable(): bool
    {
        return $this->is_subscribed && $this->bounce_count === 0;
    }
}
