<?php

declare(strict_types=1);

namespace MatrixCLI\Payload;

use MatrixCLI\Enums\PayloadType;

final readonly class UrlPayload implements PayloadInterface
{
    public function __construct(
        private string $url
    ) {}

    public function getFormattedData(): string
    {
        return $this->url;
    }

    public function getType(): PayloadType
    {
        return PayloadType::URL;
    }
}
