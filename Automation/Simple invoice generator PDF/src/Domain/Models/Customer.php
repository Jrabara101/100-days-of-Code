<?php

declare(strict_types=1);

namespace InvioCLI\Domain\Models;

readonly class Customer
{
    public function __construct(
        public string $id,
        public string $name,
        public string $address,
        public string $email
    ) {
    }
}
