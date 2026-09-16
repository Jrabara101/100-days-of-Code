<?php

declare(strict_types=1);

namespace App\Nodes\Contracts;

use App\DTOs\WorkflowContext;
use Closure;

/**
 * Contract for discrete workflow nodes processed through Illuminate\Pipeline\Pipeline.
 */
interface NodeInterface
{
    /**
     * Execute the discrete task step, inspect or mutate the context,
     * and invoke $next($context) to pass to the downstream node.
     *
     * @param WorkflowContext $context
     * @param Closure(WorkflowContext): WorkflowContext $next
     * @return WorkflowContext
     */
    public function handle(WorkflowContext $context, Closure $next): WorkflowContext;

    /**
     * Machine-readable node key (e.g. 'webhook_receiver').
     */
    public function key(): string;

    /**
     * Human-readable node display name for topology rendering.
     */
    public function label(): string;
}
