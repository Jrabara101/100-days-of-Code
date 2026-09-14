<?php

declare(strict_types=1);

namespace App\Jobs;

use App\DTOs\WorkflowContext;
use App\DTOs\WorkflowPayload;
use App\Enums\LogLevel;
use App\Enums\NodeStatus;
use App\Events\NodeExecutionCompleted;
use App\Events\NodeExecutionFailed;
use App\Models\WorkflowEvent;
use App\Models\WorkflowNodeExecution;
use App\Models\WorkflowRun;
use App\Nodes\Contracts\AsyncNodeInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ExecuteAsyncNodeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        public readonly string $runId,
        public readonly string $nodeKey,
        public readonly string $nodeClass,
        public readonly array $payloadData,
        public readonly array $payloadMeta,
        public readonly string $queueName = 'high-priority',
    ) {
        $this->onQueue($this->queueName);
    }

    public function handle(): void
    {
        $start = microtime(true);

        /** @var WorkflowNodeExecution|null $nodeExec */
        $nodeExec = WorkflowNodeExecution::where('workflow_run_id', $this->runId)
            ->where('node_key', $this->nodeKey)
            ->first();

        if (! $nodeExec) {
            return;
        }

        $nodeExec->update([
            'status' => NodeStatus::PROCESSING,
            'attempts' => $nodeExec->attempts + 1,
            'started_at' => now(),
        ]);

        $payload = WorkflowPayload::fromArray($this->payloadData, $this->payloadMeta);
        $context = WorkflowContext::create(
            runId: $this->runId,
            definitionId: $nodeExec->workflowRun->workflow_definition_id,
            trigger: $nodeExec->workflowRun->trigger_source,
            payload: $payload,
        );

        try {
            /** @var AsyncNodeInterface $nodeInstance */
            $nodeInstance = app()->make($this->nodeClass);
            $updatedContext = $nodeInstance->executeAsync($context);

            $durationMs = (microtime(true) - $start) * 1000;
            $outputSnapshot = $updatedContext->payload->toArray();
            $statusDetail = $updatedContext->stepOutputs[$this->nodeKey]['status_detail'] ?? 'Async Processing Completed';

            $nodeExec->update([
                'status' => NodeStatus::COMPLETED,
                'execution_time_ms' => $durationMs,
                'status_detail' => $statusDetail,
                'output_payload_snapshot' => $outputSnapshot,
                'completed_at' => now(),
            ]);

            // Update parent run
            WorkflowRun::where('id', $this->runId)->update([
                'current_payload' => $outputSnapshot,
            ]);

            // Record immutable event
            WorkflowEvent::create([
                'workflow_run_id' => $this->runId,
                'node_key' => $this->nodeKey,
                'event_type' => 'ASYNC_NODE_COMPLETED',
                'log_level' => LogLevel::SUCCESS,
                'message' => "Async job completed on queue [{$this->queueName}] in " . number_format($durationMs, 2) . "ms",
                'payload_before' => $this->payloadData,
                'payload_after' => $outputSnapshot,
                'metadata' => [
                    'queue' => $this->queueName,
                    'duration_ms' => $durationMs,
                ],
            ]);

            event(new NodeExecutionCompleted(
                runId: $this->runId,
                nodeKey: $this->nodeKey,
                durationMs: $durationMs,
                statusDetail: $statusDetail,
                outputSnapshot: $outputSnapshot,
            ));
        } catch (Throwable $e) {
            $nodeExec->update([
                'status' => NodeStatus::FAILED,
                'error_message' => $e->getMessage(),
            ]);

            WorkflowEvent::create([
                'workflow_run_id' => $this->runId,
                'node_key' => $this->nodeKey,
                'event_type' => 'ASYNC_NODE_FAILED',
                'log_level' => LogLevel::ERROR,
                'message' => "Async job failed on queue [{$this->queueName}]: {$e->getMessage()}",
                'metadata' => [
                    'exception' => get_class($e),
                ],
            ]);

            event(new NodeExecutionFailed(
                runId: $this->runId,
                nodeKey: $this->nodeKey,
                errorMessage: $e->getMessage(),
                attempt: $nodeExec->attempts,
                exception: $e,
            ));

            throw $e;
        }
    }
}
