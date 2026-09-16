<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowDefinition extends Model
{
    protected $table = 'workflow_definitions';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'description',
        'trigger_type',
        'version',
        'dag_topology',
        'is_active',
    ];

    protected $casts = [
        'dag_topology' => 'array',
        'is_active' => 'boolean',
    ];

    public function nodes(): HasMany
    {
        return $this->hasMany(WorkflowNode::class, 'workflow_definition_id', 'id')->orderBy('order_index');
    }

    public function runs(): HasMany
    {
        return $this->hasMany(WorkflowRun::class, 'workflow_definition_id', 'id');
    }
}
