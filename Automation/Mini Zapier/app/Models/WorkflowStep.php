<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'order',
        'name',
        'action_key',
        'template',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'template' => 'array',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
