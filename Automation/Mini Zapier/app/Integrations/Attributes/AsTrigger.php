<?php

declare(strict_types=1);

namespace App\Integrations\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
readonly class AsTrigger
{
    /**
     * @param array<string, string> $outputSchema
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $type,
        public string $route,
        public string $description = '',
        public array $outputSchema = [],
    ) {
    }
}
