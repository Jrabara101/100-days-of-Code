<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Throwable;

class NodeExecutionFailed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $runId,
        public readonly string $nodeKey,
        public readonly string $errorMessage,
        public readonly int $attempt = 1,
        public readonly ?Throwable $exception = null,
    ) {
    }
}
