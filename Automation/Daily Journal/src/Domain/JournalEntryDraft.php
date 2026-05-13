<?php

declare(strict_types=1);

namespace ChronoVault\Domain;

/**
 * JournalEntryDraft — Mutable value object used before persistence.
 *
 * Unlike the readonly JournalEntry, a Draft is assembled piecemeal:
 * - The body is set after $EDITOR returns
 * - Tags and mood are set interactively via CLI prompts
 * - Word count is computed automatically from the body
 *
 * Once the user confirms, it is passed to the repository for encryption
 * and storage, which returns a finalized JournalEntry.
 */
class JournalEntryDraft
{
    public string $body    = '';
    public ?Mood  $mood    = null;
    public array  $tags    = [];
    public string $date;

    public function __construct()
    {
        $this->date = date('Y-m-d');
    }

    /**
     * Computes word count from the current body text.
     */
    public function wordCount(): int
    {
        $trimmed = trim($this->body);
        if ($trimmed === '') {
            return 0;
        }
        return str_word_count($trimmed);
    }

    /**
     * Parses raw tag input string into a clean array.
     * Accepts "#focus #anxiety" or "focus, anxiety" etc.
     */
    public function setTagsFromString(string $input): void
    {
        preg_match_all('/#?\w+/', $input, $matches);
        $this->tags = array_map(
            fn(string $t) => '#' . ltrim(strtolower($t), '#'),
            $matches[0]
        );
    }

    /**
     * Returns true if the draft has a non-empty body.
     */
    public function hasContent(): bool
    {
        return trim($this->body) !== '';
    }
}
