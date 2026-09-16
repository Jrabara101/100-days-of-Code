<?php

declare(strict_types=1);

namespace App\Models;

use App\Integrations\Enums\WorkflowStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'name',
        'trigger_type',
        'trigger_name',
        'trigger_route',
        'status',
        'summary_mapping',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkflowStatus::class,
            'is_active' => 'boolean',
        ];
    }

    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class)->orderBy('order');
    }

    public function executions(): HasMany
    {
        return $this->hasMany(WorkflowExecution::class)->latest('id');
    }
}
