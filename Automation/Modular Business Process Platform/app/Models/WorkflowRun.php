<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\WorkflowStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowRun extends Model
{
    protected $table = 'workflow_runs';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'workflow_definition_id',
        'status',
        'trigger_source',
        'initial_payload',
        'current_payload',
        'current_node_key',
        'total_execution_time_ms',
        'started_at',
        'completed_at',
        'error_summary',
    ];

    protected $casts = [
        'status' => WorkflowStatus::class,
        'initial_payload' => 'array',
        'current_payload' => 'array',
        'total_execution_time_ms' => 'float',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function workflowDefinition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id', 'id');
    }

    public function nodeExecutions(): HasMany
    {
        return $this->hasMany(WorkflowNodeExecution::class, 'workflow_run_id', 'id')->orderBy('order_index');
    }

    public function events(): HasMany
    {
        return $this->hasMany(WorkflowEvent::class, 'workflow_run_id', 'id')->orderBy('id');
    }
}
