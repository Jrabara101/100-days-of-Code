<?php

declare(strict_types=1);

namespace App\Models;

use App\Integrations\Enums\WorkflowStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowExecution extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'status',
        'trigger_payload',
        'accumulated_context',
        'topology_trace',
        'total_duration_seconds',
        'error_message',
        'executed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkflowStatus::class,
            'trigger_payload' => 'array',
            'accumulated_context' => 'array',
            'topology_trace' => 'array',
            'total_duration_seconds' => 'float',
            'executed_at' => 'datetime',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
