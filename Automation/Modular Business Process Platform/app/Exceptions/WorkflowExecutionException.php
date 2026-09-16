<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;
use Throwable;

final class WorkflowExecutionException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $nodeKey = '',
        public readonly array $context = [],
        int $code = 0,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
