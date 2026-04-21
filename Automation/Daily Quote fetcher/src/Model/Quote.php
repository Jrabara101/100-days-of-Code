<?php

declare(strict_types=1);

namespace DailyQuote\Model;

/**
 * Quote — immutable domain model.
 */
final class Quote
{
    public function __construct(
        public readonly string    $text,
        public readonly string    $author,
        public readonly \DateTimeImmutable $fetchedAt,
        public readonly string    $source = '',
    ) {}

    /**
     * Build from raw ZenQuotes API response array element.
     *
     * @param  array{q: string, a: string, h?: string} $data
     */
    public static function fromZenQuotesArray(array $data): self
    {
        return new self(
            text:      trim((string) ($data['q'] ?? 'No quote available')),
            author:    trim((string) ($data['a'] ?? 'Unknown')),
            fetchedAt: new \DateTimeImmutable('now'),
            source:    'ZenQuotes API',
        );
    }

    /**
     * Serialise to array for JSON storage.
     *
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return [
            'quote'      => $this->text,
            'author'     => $this->author,
            'source'     => $this->source,
            'fetched_at' => $this->fetchedAt->format(\DateTimeInterface::ATOM),
            'date'       => $this->fetchedAt->format('Y-m-d'),
        ];
    }

    /**
     * Human-readable text representation.
     */
    public function toText(): string
    {
        return implode(PHP_EOL, [
            '─────────────────────────────────────────────',
            'DAILY QUOTE — ' . $this->fetchedAt->format('D, d M Y'),
            '─────────────────────────────────────────────',
            '',
            '"' . $this->text . '"',
            '',
            '  — ' . $this->author,
            '',
            'Source    : ' . $this->source,
            'Fetched At: ' . $this->fetchedAt->format('Y-m-d H:i:s T'),
            '─────────────────────────────────────────────',
        ]);
    }
}
