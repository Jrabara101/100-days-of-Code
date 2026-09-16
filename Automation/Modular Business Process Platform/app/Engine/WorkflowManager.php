<?php

declare(strict_types=1);

namespace App\Engine;

use App\DTOs\WorkflowContext;
use App\DTOs\WorkflowPayload;
use App\Engine\DAG\GraphResolver;
use App\Engine\Pipeline\WorkflowPipeline;
use App\Enums\LogLevel;
use App\Enums\NodeStatus;
use App\Enums\WorkflowStatus;
use App\Events\NodeExecutionCompleted;
use App\Events\NodeExecutionFailed;
use App\Events\NodeExecutionStarted;
use App\Exceptions\RateLimitException;
use App\Exceptions\WorkflowExecutionException;
use App\Jobs\ExecuteAsyncNodeJob;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowEvent;
use App\Models\WorkflowNode;
use App\Models\WorkflowNodeExecution;
use App\Models\WorkflowRun;
use App\Nodes\Contracts\AsyncNodeInterface;
use App\Nodes\Contracts\NodeInterface;
use Closure;
use DateTimeImmutable;
use Illuminate\Contracts\Container\Container;
use Illuminate\Support\Facades\DB;
use Throwable;

class WorkflowManager
{
    /**
     * Optional live state observer callback for CLI rendering.
     *
     * @var (Closure(WorkflowRun, WorkflowContext, ?WorkflowNodeExecution): void)|null
     */
    protected ?Closure $stateObserver = null;

    public function __construct(
        protected Container $container,
        protected GraphResolver $graphResolver,
    ) {
    }

    /**
     * Register a callback to observe state transitions in real time.
     *
     * @param Closure(WorkflowRun, WorkflowContext, ?WorkflowNodeExecution): void $callback
     */
    public function onStateChange(Closure $callback): self
    {
        $this->stateObserver = $callback;

        return $this;
    }

    /**
     * Execute or resume a workflow run.
     *
     * @param string $runId Unique identifier for this run (e.g. WF-992-ALPHA)
     * @param WorkflowDefinition|null $definition
     * @param WorkflowPayload|null $initialPayload
     * @param bool $resume Whether to resume an existing run idempotently
     * @return WorkflowContext Final resulting context
     */
    public function executeRun(
        string $runId,
        ?WorkflowDefinition $definition = null,
        ?WorkflowPayload $initialPayload = null,
        bool $resume = false,
    ): WorkflowContext {
        $incomingPayload = $initialPayload;

        // 1. Locate or create WorkflowRun
        $run = WorkflowRun::find($runId);

        if (! $run) {
            if (! $definition) {
                throw new WorkflowExecutionException("Cannot create run {$runId}: Definition not provided.");
            }

            $initialPayload ??= WorkflowPayload::fromArray([]);

            $run = WorkflowRun::create([
                'id' => $runId,
                'workflow_definition_id' => $definition->id,
                'status' => WorkflowStatus::INITIALIZED,
                'trigger_source' => $definition->trigger_type,
                'initial_payload' => $initialPayload->toArray(),
                'current_payload' => $initialPayload->toArray(),
                'total_execution_time_ms' => 0,
                'started_at' => now(),
            ]);

            $this->logEvent(
                runId: $runId,
                eventType: 'RUN_INITIALIZED',
                level: LogLevel::INFO,
                message: 'Workflow initialized.',
                payloadBefore: null,
                payloadAfter: $initialPayload->toArray(),
            );
        } else {
            $definition ??= $run->workflowDefinition;
            if (! $resume) {
                // Fresh execution: Reset state
                $initialPayload ??= WorkflowPayload::fromArray($run->initial_payload ?? []);
                $run->update([
                    'status' => WorkflowStatus::INITIALIZED,
                    'current_payload' => $initialPayload->toArray(),
                    'current_node_key' => null,
                    'error_summary' => null,
                    'started_at' => now(),
                    'completed_at' => null,
                ]);

                WorkflowNodeExecution::where('workflow_run_id', $runId)->update([
                    'status' => NodeStatus::PENDING,
                    'attempts' => 0,
                    'execution_time_ms' => 0,
                    'status_detail' => 'Pending',
                    'error_message' => null,
                    'started_at' => null,
                    'completed_at' => null,
                ]);

                $this->logEvent(
                    runId: $runId,
                    eventType: 'RUN_REINITIALIZED',
                    level: LogLevel::INFO,
                    message: 'Workflow re-initialized for fresh execution.',
                    payloadBefore: null,
                    payloadAfter: $initialPayload->toArray(),
                );
            } else {
                $initialPayload = WorkflowPayload::fromArray($run->initial_payload ?? []);
                // If resuming without requesting a simulated failure, clear prior failure simulation flags
                if (! $incomingPayload?->get('__simulation.fail_at')) {
                    $clonedData = $initialPayload->data;
                    unset($clonedData['__simulation']['fail_at']);
                    $initialPayload = new WorkflowPayload($clonedData, $initialPayload->meta);
                    $run->update(['initial_payload' => $initialPayload->toArray()]);
                }
            }
        }

        // 2. Fetch definition nodes and resolve DAG topological order
        $nodes = $definition->nodes()->with('configurable')->orderBy('order_index')->get();

        $nodeMap = [];
        foreach ($nodes as $node) {
            $nodeMap[$node->node_key] = [
                'class' => $node->node_class,
                'model' => $node,
            ];
        }

        $orderedNodeKeys = $this->graphResolver->resolve($nodeMap);

        // 3. Ensure WorkflowNodeExecution records exist for all nodes
        foreach ($orderedNodeKeys as $index => $nodeKey) {
            /** @var WorkflowNode $nodeModel */
            $nodeModel = $nodeMap[$nodeKey]['model'];

            WorkflowNodeExecution::firstOrCreate(
                [
                    'workflow_run_id' => $runId,
                    'node_key' => $nodeKey,
                ],
                [
                    'node_class' => $nodeModel->node_class,
                    'order_index' => $index + 1,
                    'status' => NodeStatus::PENDING,
                    'attempts' => 0,
                    'max_attempts' => $nodeModel->max_attempts,
                    'is_async' => $nodeModel->is_async,
                    'queue_name' => $nodeModel->queue_name,
                    'execution_time_ms' => 0,
                    'status_detail' => 'Pending',
                ]
            );
        }

        $run->update(['status' => WorkflowStatus::RUNNING]);

        // 4. Construct Context DTO
        $currentPayload = WorkflowPayload::fromArray($run->current_payload ?? $initialPayload->toArray());
        $context = WorkflowContext::create(
            runId: $runId,
            definitionId: $definition->id,
            trigger: $run->trigger_source,
            payload: $currentPayload,
            isResumed: $resume,
        );

        $this->notifyObserver($run, $context, null);

        // 5. Execute Nodes Sequentially with Idempotency & Resumption checks
        $startTimeTotal = microtime(true);

        foreach ($orderedNodeKeys as $index => $nodeKey) {
            /** @var WorkflowNode $nodeModel */
            $nodeModel = $nodeMap[$nodeKey]['model'];

            /** @var WorkflowNodeExecution $execution */
            $execution = WorkflowNodeExecution::where('workflow_run_id', $runId)
                ->where('node_key', $nodeKey)
                ->firstOrFail();

            // IDEMPOTENCY CHECK:
            // If the node already completed successfully, skip re-execution and restore snapshot
            if ($execution->status === NodeStatus::COMPLETED && $resume) {
                if ($execution->output_payload_snapshot) {
                    $restoredPayload = WorkflowPayload::fromArray($execution->output_payload_snapshot);
                    if (! $incomingPayload?->get('__simulation.fail_at')) {
                        $clonedData = $restoredPayload->data;
                        unset($clonedData['__simulation']['fail_at']);
                        $restoredPayload = new WorkflowPayload($clonedData, $restoredPayload->meta);
                    }
                    $context = $context->withPayload($restoredPayload);
                }

                $context = $context->addLog(
                    level: LogLevel::INFO,
                    message: "Idempotent resume: {$nodeKey} previously completed. Restoring snapshot.",
                    nodeKey: $nodeKey,
                );

                $this->notifyObserver($run, $context, $execution);
                continue;
            }

            // If resuming and node was previously failed, reset attempt counter for new attempt cycle
            if ($resume && $execution->status === NodeStatus::FAILED) {
                $execution->update([
                    'status' => NodeStatus::PENDING,
                    'attempts' => 0,
                    'error_message' => null,
                ]);
            }

            // Execute Node (Sync or Async)
            $context = $this->executeSingleNode(
                run: $run,
                nodeModel: $nodeModel,
                execution: $execution,
                context: $context,
            );

            // Update run payload snapshot
            $run->update([
                'current_payload' => $context->payload->toArray(),
                'current_node_key' => $nodeKey,
            ]);

            $this->notifyObserver($run, $context, $execution);
        }

        $totalMs = (microtime(true) - $startTimeTotal) * 1000;

        $run->update([
            'status' => WorkflowStatus::COMPLETED,
            'completed_at' => now(),
            'total_execution_time_ms' => $totalMs,
        ]);

        $this->notifyObserver($run, $context, null);

        return $context;
    }

    /**
     * Execute a single node with retry, exponential backoff, and event auditing.
     */
    protected function executeSingleNode(
        WorkflowRun $run,
        WorkflowNode $nodeModel,
        WorkflowNodeExecution $execution,
        WorkflowContext $context,
    ): WorkflowContext {
        $nodeClass = $nodeModel->node_class;
        $nodeKey = $nodeModel->node_key;

        // Instantiate Node using Laravel's Service Container and pass polymorphic config
        /** @var NodeInterface $nodeInstance */
        $nodeInstance = $this->container->make($nodeClass, [
            'config' => $nodeModel->configurable,
        ]);

        $maxAttempts = $nodeModel->max_attempts;
        $attempt = $execution->attempts;

        while ($attempt < $maxAttempts) {
            $attempt++;
            $stepStart = microtime(true);

            $execution->update([
                'status' => NodeStatus::PROCESSING,
                'attempts' => $attempt,
                'started_at' => now(),
            ]);

            event(new NodeExecutionStarted(
                runId: $run->id,
                nodeKey: $nodeKey,
                isAsync: $nodeModel->is_async,
                queueName: $nodeModel->queue_name,
                attempt: $attempt,
            ));

            if ($nodeModel->is_async) {
                $context = $context->addLog(
                    level: LogLevel::QUEUE,
                    message: "{$nodeKey} dispatched to worker queue [{$nodeModel->queue_name}].",
                    nodeKey: $nodeKey,
                );
            }

            $this->notifyObserver($run, $context, $execution);

            $payloadBefore = $context->payload->toArray();

            try {
                // Execute via Pipeline
                $pipeline = new WorkflowPipeline($this->container);

                $updatedContext = $pipeline
                    ->sendContext($context)
                    ->throughNodes([$nodeInstance])
                    ->execute();

                $stepDurationMs = (microtime(true) - $stepStart) * 1000;
                $payloadAfter = $updatedContext->payload->toArray();

                $statusDetail = $updatedContext->stepOutputs[$nodeKey]['status_detail'] ?? 'Completed';

                $execution->update([
                    'status' => NodeStatus::COMPLETED,
                    'execution_time_ms' => $stepDurationMs,
                    'status_detail' => $statusDetail,
                    'input_payload_snapshot' => $payloadBefore,
                    'output_payload_snapshot' => $payloadAfter,
                    'completed_at' => now(),
                    'error_message' => null,
                ]);

                // Event Sourced Audit Record
                $this->logEvent(
                    runId: $run->id,
                    eventType: 'NODE_COMPLETED',
                    level: LogLevel::SUCCESS,
                    message: "Node {$nodeKey} completed in " . number_format($stepDurationMs, 2) . 'ms.',
                    payloadBefore: $payloadBefore,
                    payloadAfter: $payloadAfter,
                    nodeKey: $nodeKey,
                    deltaSummary: "Payload mutated by {$nodeKey}",
                );

                event(new NodeExecutionCompleted(
                    runId: $run->id,
                    nodeKey: $nodeKey,
                    durationMs: $stepDurationMs,
                    statusDetail: $statusDetail,
                    outputSnapshot: $payloadAfter,
                ));

                return $updatedContext;
            } catch (RateLimitException $e) {
                // Exponential backoff
                $stepDurationMs = (microtime(true) - $stepStart) * 1000;
                $backoffSeconds = (int) (pow(2, $attempt - 1) * $e->retryAfterSeconds);

                $execution->update([
                    'status' => NodeStatus::RATE_LIMITED,
                    'error_message' => "Rate limited: {$e->getMessage()}",
                    'execution_time_ms' => $stepDurationMs,
                ]);

                $context = $context->withPayload(
                    $context->payload->with('__simulation.rate_limit_recovered', true)
                );

                $context = $context->addLog(
                    level: LogLevel::RETRY,
                    message: "Rate limit hit on {$nodeKey}. Backing off for {$backoffSeconds}s (Attempt {$attempt}/{$maxAttempts})...",
                    nodeKey: $nodeKey,
                );

                $this->logEvent(
                    runId: $run->id,
                    eventType: 'RATE_LIMIT_BACKOFF',
                    level: LogLevel::WARNING,
                    message: "Rate limit triggered on {$nodeKey}. Exponential backoff {$backoffSeconds}s.",
                    payloadBefore: $payloadBefore,
                    payloadAfter: $payloadBefore,
                    nodeKey: $nodeKey,
                );

                $this->notifyObserver($run, $context, $execution);

                if ($attempt < $maxAttempts) {
                    sleep($backoffSeconds);
                    continue; // Retry loop
                }

                $this->markRunFailed($run, $execution, $e->getMessage());
                throw $e;
            } catch (Throwable $e) {
                $stepDurationMs = (microtime(true) - $stepStart) * 1000;

                $execution->update([
                    'status' => NodeStatus::FAILED,
                    'error_message' => $e->getMessage(),
                    'execution_time_ms' => $stepDurationMs,
                ]);

                $context = $context->addLog(
                    level: LogLevel::ERROR,
                    message: "Node {$nodeKey} failed: {$e->getMessage()}",
                    nodeKey: $nodeKey,
                );

                $this->logEvent(
                    runId: $run->id,
                    eventType: 'NODE_FAILED',
                    level: LogLevel::ERROR,
                    message: "Execution failed at {$nodeKey}: {$e->getMessage()}",
                    payloadBefore: $payloadBefore,
                    payloadAfter: $payloadBefore,
                    nodeKey: $nodeKey,
                );

                $this->markRunFailed($run, $execution, $e->getMessage());
                $this->notifyObserver($run, $context, $execution);

                throw $e;
            }
        }

        throw new WorkflowExecutionException("Node {$nodeKey} exceeded maximum retry attempts ({$maxAttempts}).");
    }

    protected function markRunFailed(WorkflowRun $run, WorkflowNodeExecution $execution, string $errorMessage): void
    {
        $run->update([
            'status' => WorkflowStatus::FAILED,
            'current_node_key' => $execution->node_key,
            'error_summary' => $errorMessage,
            'completed_at' => now(),
        ]);
    }

    protected function logEvent(
        string $runId,
        string $eventType,
        LogLevel $level,
        string $message,
        ?array $payloadBefore,
        ?array $payloadAfter,
        ?string $nodeKey = null,
        ?string $deltaSummary = null,
        ?array $metadata = null,
    ): void {
        WorkflowEvent::create([
            'workflow_run_id' => $runId,
            'node_key' => $nodeKey,
            'event_type' => $eventType,
            'log_level' => $level,
            'message' => $message,
            'delta_summary' => $deltaSummary,
            'payload_before' => $payloadBefore,
            'payload_after' => $payloadAfter,
            'metadata' => $metadata,
        ]);
    }

    protected function notifyObserver(
        WorkflowRun $run,
        WorkflowContext $context,
        ?WorkflowNodeExecution $currentExecution,
    ): void {
        if ($this->stateObserver !== null) {
            ($this->stateObserver)($run, $context, $currentExecution);
        }
    }
}
