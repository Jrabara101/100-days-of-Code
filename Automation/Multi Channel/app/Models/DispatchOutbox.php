<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DispatchOutbox extends Model
{
    protected $table = 'dispatch_outbox';
    protected $guarded = [];

    protected $casts = [
        'dispatched_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(DispatchEvent::class, 'dispatch_event_id');
    }

    public function subscriber(): BelongsTo
    {
        return $this->belongsTo(NotificationSubscriber::class, 'subscriber_id');
    }
}
