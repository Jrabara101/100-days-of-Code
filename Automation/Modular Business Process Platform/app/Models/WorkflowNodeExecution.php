<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\NodeStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowNodeExecution extends Model
{
    protected $table = 'workflow_node_executions';

    protected $fillable = [
        'workflow_run_id',
        'node_key',
        'node_class',
        'order_index',
        'status',
        'attempts',
        'max_attempts',
        'is_async',
        'queue_name',
        'execution_time_ms',
        'status_detail',
        'input_payload_snapshot',
        'output_payload_snapshot',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'status' => NodeStatus::class,
        'order_index' => 'integer',
        'attempts' => 'integer',
        'max_attempts' => 'integer',
        'is_async' => 'boolean',
        'execution_time_ms' => 'float',
        'input_payload_snapshot' => 'array',
        'output_payload_snapshot' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function workflowRun(): BelongsTo
    {
        return $this->belongsTo(WorkflowRun::class, 'workflow_run_id', 'id');
    }
}
