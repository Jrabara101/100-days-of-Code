<?php

declare(strict_types=1);

namespace App\Integrations\Contracts;

use App\Integrations\DTOs\ActionResult;
use App\Integrations\DTOs\Payload;

/**
 * Strategy Pattern Interface for Executable Workflow Actions.
 */
interface ActionInterface
{
    /**
     * Execute the action using mapped, dynamic inputs provided in the Payload DTO.
     */
    public function execute(Payload $payload): ActionResult;

    /**
     * Human-readable name of the action.
     */
    public function getName(): string;

    /**
     * Description of what this action does.
     */
    public function getDescription(): string;

    /**
     * Input validation schema and parameter expectations.
     *
     * @return array<string, string>
     */
    public function getInputSchema(): array;
}
