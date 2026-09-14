<?php

declare(strict_types=1);

namespace App\Nodes\Contracts;

use App\DTOs\WorkflowContext;

/**
 * Contract for heavy nodes dispatched to Laravel Queues (Redis/Horizon/Database).
 */
interface AsyncNodeInterface extends NodeInterface
{
    /**
     * Target queue name (e.g. 'high-priority', 'default').
     */
    public function queueName(): string;

    /**
     * Maximum retry attempts before marked as failed.
     */
    public function maxAttempts(): int;

    /**
     * Executes the long-running asynchronous workload within a queued job.
     */
    public function executeAsync(WorkflowContext $context): WorkflowContext;
}
