<?php

declare(strict_types=1);

namespace App\Services\Scraper\Contracts;

use App\Services\Scraper\Dto\ScrapedItemDto;

interface ScraperStrategyInterface
{
    public function getIdentifier(): string;

    /**
     * @return array<ScrapedItemDto>
     */
    public function parseHtml(string $html, string $baseUrl): array;
}
