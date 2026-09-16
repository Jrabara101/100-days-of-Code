<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LogLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowEvent extends Model
{
    protected $table = 'workflow_events';

    protected $fillable = [
        'workflow_run_id',
        'node_key',
        'event_type',
        'log_level',
        'message',
        'delta_summary',
        'payload_before',
        'payload_after',
        'metadata',
    ];

    protected $casts = [
        'log_level' => LogLevel::class,
        'payload_before' => 'array',
        'payload_after' => 'array',
        'metadata' => 'array',
    ];

    public function workflowRun(): BelongsTo
    {
        return $this->belongsTo(WorkflowRun::class, 'workflow_run_id', 'id');
    }
}
