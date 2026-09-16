<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Integrations\DTOs\InterpolationTrace;
use App\Integrations\Enums\WorkflowStatus;
use App\Integrations\Registry\IntegrationRegistry;
use App\Models\WorkflowExecution;
use App\Models\WorkflowStep;
use App\Services\PayloadMapper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class ExecuteWorkflowStep implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $executionId,
        public readonly int $stepId,
        public readonly int $stepOrder,
        public readonly bool $isFinalStep = false
    ) {
    }

    public function handle(PayloadMapper $mapper, IntegrationRegistry $registry): void
    {
        /** @var WorkflowExecution|null $execution */
        $execution = WorkflowExecution::with('workflow.steps')->find($this->executionId);

        if (! $execution) {
            Log::error("ExecuteWorkflowStep: Execution #{$this->executionId} not found.");
            return;
        }

        // If execution has already failed in an earlier step, abort cleanly
        if ($execution->status === WorkflowStatus::FAILED || $execution->status === WorkflowStatus::CANCELLED) {
            Log::warning("Execution #{$this->executionId} is already marked as {$execution->status->value}. Skipping step {$this->stepOrder}.");
            return;
        }

        /** @var WorkflowStep|null $step */
        $step = WorkflowStep::find($this->stepId);
        if (! $step) {
            throw new RuntimeException("Workflow Step #{$this->stepId} not found.");
        }

        $accumulatedContext = $execution->accumulated_context ?? [];
        $topologyTrace = $execution->topology_trace ?? [];

        // 1. Dynamic Payload Interpolation via PayloadMapper (dot-notation & data_get)
        $mappingResult = $mapper->mapToPayload(
            template: $step->template ?? [],
            context: $accumulatedContext,
            workflowId: (string) $execution->workflow_id,
            stepOrder: $step->order
        );

        $payload = $mappingResult['payload'];
        /** @var array<InterpolationTrace> $traces */
        $traces = $mappingResult['traces'];

        // 2. Strategy Pattern: Resolve Action implementation via Container
        $action = $registry->resolveAction($step->action_key);

        $stepStartTime = microtime(true);

        try {
            // 3. Execute isolated action strategy
            $result = $action->execute($payload);
        } catch (Throwable $e) {
            $duration = round(microtime(true) - $stepStartTime, 3);
            $this->recordStepFailure($execution, $step, $traces, $e->getMessage(), $duration);
            throw new RuntimeException("Action [{$step->name}] encountered an exception: {$e->getMessage()}", 0, $e);
        }

        $duration = $result->durationSeconds > 0 ? $result->durationSeconds : round(microtime(true) - $stepStartTime, 2);

        if (! $result->successful) {
            $this->recordStepFailure($execution, $step, $traces, $result->errorMessage ?? 'Action returned unsuccessful status', $duration);
            throw new RuntimeException("Action [{$step->name}] failed: " . ($result->errorMessage ?? 'Unknown error'));
        }

        // 4. On Success: accumulate step output into workflow context
        $stepKey = "step_{$step->order}";
        $accumulatedContext[$stepKey] = $result->output;
        $accumulatedContext[$step->action_key] = $result->output;

        // Record trace for live CLI topology visualization
        $traceData = [
            'order' => $step->order,
            'name' => $step->name,
            'action_key' => $step->action_key,
            'duration' => $duration,
            'status' => 'SUCCESS',
            'traces' => array_map(fn (InterpolationTrace $t) => [
                'token' => $t->token,
                'resolved' => $t->resolvedValue,
                'target' => $t->targetKey,
            ], $traces),
            'output' => $result->output,
            'logs' => $result->logs,
        ];

        $topologyTrace[] = $traceData;

        $execution->accumulated_context = $accumulatedContext;
        $execution->topology_trace = $topologyTrace;
        $execution->total_duration_seconds += $duration;

        if ($this->isFinalStep) {
            $execution->status = WorkflowStatus::SUCCESS;
        }

        $execution->save();
    }

    /**
     * Record step failure in the execution trace.
     *
     * @param array<InterpolationTrace> $traces
     */
    private function recordStepFailure(
        WorkflowExecution $execution,
        WorkflowStep $step,
        array $traces,
        string $errorMessage,
        float $duration
    ): void {
        $topologyTrace = $execution->topology_trace ?? [];

        $topologyTrace[] = [
            'order' => $step->order,
            'name' => $step->name,
            'action_key' => $step->action_key,
            'duration' => $duration,
            'status' => 'FAILED',
            'error' => $errorMessage,
            'traces' => array_map(fn (InterpolationTrace $t) => [
                'token' => $t->token,
                'resolved' => $t->resolvedValue,
                'target' => $t->targetKey,
            ], $traces),
        ];

        $execution->topology_trace = $topologyTrace;
        $execution->status = WorkflowStatus::FAILED;
        $execution->error_message = $errorMessage;
        $execution->total_duration_seconds += $duration;
        $execution->save();
    }
}
