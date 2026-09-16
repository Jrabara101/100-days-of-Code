<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationProvider extends Model
{
    protected $guarded = [];

    protected $casts = [
        'circuit_opened_at' => 'datetime',
        'last_canary_probed_at' => 'datetime',
    ];
}
