<?php

declare(strict_types=1);

namespace App\Integrations\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
readonly class AsAction
{
    /**
     * @param array<string, string> $inputSchema Key-type description of required inputs
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $description = '',
        public array $inputSchema = [],
    ) {
    }
}
