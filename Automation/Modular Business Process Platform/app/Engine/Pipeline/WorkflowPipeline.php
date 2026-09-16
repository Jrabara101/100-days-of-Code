<?php

declare(strict_types=1);

namespace App\Engine\Pipeline;

use App\DTOs\WorkflowContext;
use Closure;
use Illuminate\Contracts\Container\Container;
use Illuminate\Pipeline\Pipeline;

/**
 * Custom WorkflowPipeline wrapping Illuminate\Pipeline\Pipeline.
 * Passes the immutable WorkflowContext DTO through dynamic NodeInterface stages.
 */
class WorkflowPipeline extends Pipeline
{
    public function __construct(?Container $container = null)
    {
        parent::__construct($container ?? app());
    }

    /**
     * Set the initial passable context DTO.
     */
    public function sendContext(WorkflowContext $context): self
    {
        return $this->send($context);
    }

    /**
     * Set the list of dynamically resolved Node pipe instances.
     *
     * @param array<int, mixed> $pipes
     */
    public function throughNodes(array $pipes): self
    {
        return $this->through($pipes);
    }

    /**
     * Run the pipeline and return the resulting context DTO.
     *
     * @param (Closure(WorkflowContext): WorkflowContext)|null $destination
     */
    public function execute(?Closure $destination = null): WorkflowContext
    {
        $destination ??= fn (WorkflowContext $context): WorkflowContext => $context;

        /** @var WorkflowContext $result */
        $result = $this->then($destination);

        return $result;
    }
}
