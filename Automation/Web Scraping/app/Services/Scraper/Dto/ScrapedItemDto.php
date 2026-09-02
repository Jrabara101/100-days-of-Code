<?php

declare(strict_types=1);

namespace App\Services\Scraper\Dto;

readonly class ScrapedItemDto
{
    public function __construct(
        public string $title,
        public string $canonicalUrl,
        public int $numericValueCents,
        public array $metadata
    ) {}

    public function generateFingerprint(int $targetId): string
    {
        return hash('sha256', sprintf(
            '%d|%s|%s|%d',
            $targetId,
            trim($this->canonicalUrl),
            trim($this->title),
            $this->numericValueCents
        ));
    }
}
