<?php

declare(strict_types=1);

namespace App\Models\Configurations;

use App\Models\WorkflowNode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class SlackNodeConfig extends Model
{
    protected $table = 'slack_node_configs';

    protected $fillable = [
        'webhook_url',
        'channel',
        'bot_name',
        'mention_roles',
    ];

    public function workflowNode(): MorphOne
    {
        return $this->morphOne(WorkflowNode::class, 'configurable');
    }
}
