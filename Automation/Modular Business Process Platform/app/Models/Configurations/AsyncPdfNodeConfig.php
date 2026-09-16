<?php

declare(strict_types=1);

namespace App\Models\Configurations;

use App\Models\WorkflowNode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class AsyncPdfNodeConfig extends Model
{
    protected $table = 'async_pdf_node_configs';

    protected $fillable = [
        'template_name',
        'page_orientation',
        'high_compression',
        'queue_name',
    ];

    protected $casts = [
        'high_compression' => 'boolean',
    ];

    public function workflowNode(): MorphOne
    {
        return $this->morphOne(WorkflowNode::class, 'configurable');
    }
}
