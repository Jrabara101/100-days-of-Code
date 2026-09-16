<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\LogLevel;
use DateTimeImmutable;
use JsonSerializable;

/**
 * Immutable Context DTO that flows through Illuminate\Pipeline\Pipeline.
 * Strictly adheres to PHP 8.2+ readonly class standards.
 */
readonly class WorkflowContext implements JsonSerializable
{
    public function __construct(
        public string $runId,
        public string $definitionId,
        public string $trigger,
        public WorkflowPayload $payload,
        public int $executionIndex = 0,
        public bool $isResumed = false,
        public array $stepOutputs = [],
        public array $liveLogs = [],
    ) {
    }

    /**
     * Create initial context for a run.
     */
    public static function create(
        string $runId,
        string $definitionId,
        string $trigger,
        WorkflowPayload $payload,
        bool $isResumed = false,
    ): self {
        $now = (new DateTimeImmutable())->format('H:i:s');
        $initialLogs = [
            [
                'timestamp' => $now,
                'level' => LogLevel::INFO->value,
                'message' => 'Workflow initialized.',
                'node_key' => null,
            ],
        ];

        return new self(
            runId: $runId,
            definitionId: $definitionId,
            trigger: $trigger,
            payload: $payload,
            executionIndex: 0,
            isResumed: $isResumed,
            stepOutputs: [],
            liveLogs: $initialLogs,
        );
    }

    /**
     * Returns a new context instance with updated immutable payload.
     */
    public function withPayload(WorkflowPayload $payload): self
    {
        return new self(
            runId: $this->runId,
            definitionId: $this->definitionId,
            trigger: $this->trigger,
            payload: $payload,
            executionIndex: $this->executionIndex,
            isResumed: $this->isResumed,
            stepOutputs: $this->stepOutputs,
            liveLogs: $this->liveLogs,
        );
    }

    /**
     * Returns a new context instance with updated execution pointer.
     */
    public function withExecutionIndex(int $index): self
    {
        return new self(
            runId: $this->runId,
            definitionId: $this->definitionId,
            trigger: $this->trigger,
            payload: $this->payload,
            executionIndex: $index,
            isResumed: $this->isResumed,
            stepOutputs: $this->stepOutputs,
            liveLogs: $this->liveLogs,
        );
    }

    /**
     * Records a step output snapshot.
     */
    public function withStepOutput(string $nodeKey, array $output): self
    {
        $outputs = $this->stepOutputs;
        $outputs[$nodeKey] = $output;

        return new self(
            runId: $this->runId,
            definitionId: $this->definitionId,
            trigger: $this->trigger,
            payload: $this->payload,
            executionIndex: $this->executionIndex,
            isResumed: $this->isResumed,
            stepOutputs: $outputs,
            liveLogs: $this->liveLogs,
        );
    }

    /**
     * Appends a log entry to the live log buffer.
     */
    public function addLog(string|LogLevel $level, string $message, ?string $nodeKey = null): self
    {
        $levelValue = $level instanceof LogLevel ? $level->value : $level;
        $now = (new DateTimeImmutable())->format('H:i:s');

        $logs = $this->liveLogs;
        $logs[] = [
            'timestamp' => $now,
            'level' => $levelValue,
            'message' => $message,
            'node_key' => $nodeKey,
        ];

        return new self(
            runId: $this->runId,
            definitionId: $this->definitionId,
            trigger: $this->trigger,
            payload: $this->payload,
            executionIndex: $this->executionIndex,
            isResumed: $this->isResumed,
            stepOutputs: $this->stepOutputs,
            liveLogs: $logs,
        );
    }

    public function toArray(): array
    {
        return [
            'run_id' => $this->runId,
            'definition_id' => $this->definitionId,
            'trigger' => $this->trigger,
            'payload' => $this->payload->toArray(),
            'execution_index' => $this->executionIndex,
            'is_resumed' => $this->isResumed,
            'step_outputs' => $this->stepOutputs,
            'live_logs' => $this->liveLogs,
        ];
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
