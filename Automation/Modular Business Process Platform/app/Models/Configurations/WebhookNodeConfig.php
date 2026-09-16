<?php

declare(strict_types=1);

namespace App\Models\Configurations;

use App\Models\WorkflowNode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class WebhookNodeConfig extends Model
{
    protected $table = 'webhook_node_configs';

    protected $fillable = [
        'webhook_secret',
        'signature_header',
        'expected_event',
        'ip_allowlist',
    ];

    protected $casts = [
        'ip_allowlist' => 'array',
    ];

    public function workflowNode(): MorphOne
    {
        return $this->morphOne(WorkflowNode::class, 'configurable');
    }
}
