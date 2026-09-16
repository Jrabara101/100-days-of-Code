<?php

declare(strict_types=1);

namespace App\Services;

use App\Integrations\Enums\WorkflowStatus;
use App\Jobs\ExecuteWorkflowStep;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

/**
 * CoreLink Orchestration Engine.
 *
 * Compiles a declarative Workflow into a sequential Laravel Job Chain (Bus::chain())
 * with failure interception and state propagation.
 */
class WorkflowEngine
{
    /**
     * Trigger a workflow execution with the provided incoming payload.
     *
     * @param Workflow|int $workflow
     * @param array<string, mixed> $triggerPayload
     */
    public function dispatch(Workflow|int $workflow, array $triggerPayload = [], bool $sync = false): WorkflowExecution
    {
        if (is_int($workflow)) {
            $workflow = Workflow::with('steps')->findOrFail($workflow);
        } else {
            $workflow->loadMissing('steps');
        }

        if (! $workflow->is_active) {
            throw new InvalidArgumentException("Workflow #{$workflow->id} [{$workflow->name}] is currently inactive.");
        }

        $steps = $workflow->steps;
        if ($steps->isEmpty()) {
            throw new InvalidArgumentException("Workflow #{$workflow->id} [{$workflow->name}] has no configured action steps.");
        }

        // Initialize Execution record in SQLite
        /** @var WorkflowExecution $execution */
        $execution = WorkflowExecution::create([
            'workflow_id' => $workflow->id,
            'status' => WorkflowStatus::RUNNING,
            'trigger_payload' => $triggerPayload,
            'accumulated_context' => [
                'trigger' => $triggerPayload,
            ],
            'topology_trace' => [],
            'total_duration_seconds' => 0.0,
            'executed_at' => now(),
        ]);

        // Build sequential job chain
        $jobs = [];
        $stepCount = $steps->count();

        foreach ($steps as $index => $step) {
            $isFinal = ($index === $stepCount - 1);
            $jobs[] = new ExecuteWorkflowStep(
                executionId: $execution->id,
                stepId: $step->id,
                stepOrder: $step->order,
                isFinalStep: $isFinal
            );
        }

        $executionId = $execution->id;
        $workflowName = $workflow->name;

        // Chained execution: guarantees FIFO order and halts immediately on error
        $chain = Bus::chain($jobs)
            ->catch(function (Throwable $exception) use ($executionId, $workflowName) {
                Log::error("Workflow Chain Failed: #{$executionId} [{$workflowName}]. Error: {$exception->getMessage()}");

                $exec = WorkflowExecution::find($executionId);
                if ($exec && $exec->status !== WorkflowStatus::FAILED) {
                    $exec->status = WorkflowStatus::FAILED;
                    $exec->error_message = $exception->getMessage();
                    $exec->save();
                }
            });

        if ($sync) {
            $chain->onConnection('sync');
        }

        $chain->dispatch();

        return $execution->fresh();
    }
}
