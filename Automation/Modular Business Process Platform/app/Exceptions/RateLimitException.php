<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;
use Throwable;

final class RateLimitException extends RuntimeException
{
    public function __construct(
        string $message = 'API rate limit exceeded. Retry required.',
        public readonly int $retryAfterSeconds = 2,
        int $code = 429,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
