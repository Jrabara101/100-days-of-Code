<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NodeExecutionCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $runId,
        public readonly string $nodeKey,
        public readonly float $durationMs,
        public readonly ?string $statusDetail = null,
        public readonly array $outputSnapshot = [],
    ) {
    }
}
