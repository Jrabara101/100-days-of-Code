<?php

declare(strict_types=1);

namespace App\Models\Configurations;

use App\Models\WorkflowNode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class ExtractDataNodeConfig extends Model
{
    protected $table = 'extract_data_node_configs';

    protected $fillable = [
        'mapping_rules',
        'strict_validation',
    ];

    protected $casts = [
        'mapping_rules' => 'array',
        'strict_validation' => 'boolean',
    ];

    public function workflowNode(): MorphOne
    {
        return $this->morphOne(WorkflowNode::class, 'configurable');
    }
}
