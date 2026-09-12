<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotificationSubscriber extends Model
{
    protected $guarded = [];

    protected $casts = [
        'channel_routing_priority' => 'array',
        'quiet_hours_start' => 'integer',
        'quiet_hours_end' => 'integer',
    ];

    public function dispatches(): HasMany
    {
        return $this->hasMany(DispatchOutbox::class, 'subscriber_id');
    }
}
