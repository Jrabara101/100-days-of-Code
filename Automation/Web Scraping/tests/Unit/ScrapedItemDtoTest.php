<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Scraper\Dto\ScrapedItemDto;
use PHPUnit\Framework\TestCase;

class ScrapedItemDtoTest extends TestCase
{
    public function test_fingerprint_is_deterministic(): void
    {
        $dto1 = new ScrapedItemDto(
            title: 'Sample Article',
            canonicalUrl: 'https://example.com/article-1',
            numericValueCents: 19999,
            metadata: ['author' => 'Alice']
        );

        $dto2 = new ScrapedItemDto(
            title: '  Sample Article  ',
            canonicalUrl: '  https://example.com/article-1  ',
            numericValueCents: 19999,
            metadata: ['author' => 'Bob']
        );

        $this->assertSame(
            $dto1->generateFingerprint(1),
            $dto2->generateFingerprint(1)
        );
    }

    public function test_fingerprint_changes_when_fields_differ(): void
    {
        $dto1 = new ScrapedItemDto(
            title: 'Article A',
            canonicalUrl: 'https://example.com/article',
            numericValueCents: 1000,
            metadata: []
        );

        $dto2 = new ScrapedItemDto(
            title: 'Article B',
            canonicalUrl: 'https://example.com/article',
            numericValueCents: 1000,
            metadata: []
        );

        $this->assertNotSame(
            $dto1->generateFingerprint(1),
            $dto2->generateFingerprint(1)
        );

        // Different target ID
        $this->assertNotSame(
            $dto1->generateFingerprint(1),
            $dto1->generateFingerprint(2)
        );
    }
}
