<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WorkflowNode extends Model
{
    protected $table = 'workflow_nodes';

    protected $fillable = [
        'workflow_definition_id',
        'node_key',
        'node_class',
        'order_index',
        'is_async',
        'queue_name',
        'max_attempts',
        'timeout_seconds',
        'configurable_type',
        'configurable_id',
    ];

    protected $casts = [
        'is_async' => 'boolean',
        'order_index' => 'integer',
        'max_attempts' => 'integer',
        'timeout_seconds' => 'integer',
    ];

    /**
     * Polymorphic relationship to specific node configuration models.
     */
    public function configurable(): MorphTo
    {
        return $this->morphTo();
    }

    public function workflowDefinition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id', 'id');
    }
}
