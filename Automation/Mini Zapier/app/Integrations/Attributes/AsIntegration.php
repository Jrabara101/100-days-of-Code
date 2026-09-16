<?php

declare(strict_types=1);

namespace App\Integrations\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
readonly class AsIntegration
{
    public function __construct(
        public string $id,
        public string $name,
        public string $description = '',
        public string $icon = '🔌',
        public string $version = '1.0.0',
    ) {
    }
}
