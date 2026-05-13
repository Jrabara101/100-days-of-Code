<?php

declare(strict_types=1);

namespace ChronoVault\Domain;

/**
 * JournalEntry — PHP 8.2 readonly class (immutable DTO).
 *
 * A readonly class enforces immutability at the language level: once
 * constructed, no property can be modified. This makes it ideal as a
 * Data Transfer Object returned from the repository — callers can trust
 * the data hasn't been mutated anywhere in the call stack.
 *
 * The $body field contains the DECRYPTED journal text. It is NEVER stored
 * in this form; the repository handles encryption before persistence.
 */
readonly class JournalEntry
{
    public function __construct(
        public int       $id,
        public string    $date,          // Y-m-d format
        public Mood      $mood,
        public string    $body,          // Decrypted plain text
        public int       $wordCount,
        public array     $tags,          // e.g. ['#focus', '#anxiety']
        public string    $createdAt,     // ISO-8601 datetime
    ) {}

    /**
     * Returns a formatted entry identifier like '#042'.
     */
    public function formattedId(): string
    {
        return sprintf('#%03d', $this->id);
    }

    /**
     * Returns a comma-separated tag string for display.
     */
    public function tagsForDisplay(): string
    {
        return empty($this->tags) ? '—' : implode(', ', $this->tags);
    }
}
