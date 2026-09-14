<?php

declare(strict_types=1);

namespace App\Models\Configurations;

use App\Models\WorkflowNode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class EmailNodeConfig extends Model
{
    protected $table = 'email_node_configs';

    protected $fillable = [
        'sender_email',
        'recipient_field',
        'subject_template',
        'attach_pdf',
    ];

    protected $casts = [
        'attach_pdf' => 'boolean',
    ];

    public function workflowNode(): MorphOne
    {
        return $this->morphOne(WorkflowNode::class, 'configurable');
    }
}
