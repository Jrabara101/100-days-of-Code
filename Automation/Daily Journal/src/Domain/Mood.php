<?php

declare(strict_types=1);

namespace ChronoVault\Domain;

/**
 * Mood Enum — PHP 8.2 backed enum with rich label/emoji metadata.
 *
 * Using a string-backed enum lets us store 'GREAT', 'GOOD', etc. directly
 * in SQLite without an extra lookup table. Each case carries its display
 * label and emoji via methods rather than properties, keeping the enum clean.
 */
enum Mood: string
{
    case GREAT   = 'GREAT';
    case GOOD    = 'GOOD';
    case NEUTRAL = 'NEUTRAL';
    case BAD     = 'BAD';
    case TERRIBLE = 'TERRIBLE';

    /**
     * Human-readable label for terminal display.
     */
    public function label(): string
    {
        return match($this) {
            Mood::GREAT    => 'Awesome',
            Mood::GOOD     => 'Good',
            Mood::NEUTRAL  => 'Neutral',
            Mood::BAD      => 'Bad',
            Mood::TERRIBLE => 'Awful',
        };
    }

    /**
     * Emoji representation for sparklines and entry lists.
     */
    public function emoji(): string
    {
        return match($this) {
            Mood::GREAT    => '🤩',
            Mood::GOOD     => '😊',
            Mood::NEUTRAL  => '😐',
            Mood::BAD      => '😞',
            Mood::TERRIBLE => '😫',
        };
    }

    /**
     * Numeric score (1–5) for trending/graphing calculations.
     */
    public function score(): int
    {
        return match($this) {
            Mood::GREAT    => 5,
            Mood::GOOD     => 4,
            Mood::NEUTRAL  => 3,
            Mood::BAD      => 2,
            Mood::TERRIBLE => 1,
        };
    }

    /**
     * ANSI color code for terminal coloring.
     */
    public function ansiColor(): string
    {
        return match($this) {
            Mood::GREAT    => "\e[38;5;220m",  // Gold
            Mood::GOOD     => "\e[38;5;77m",   // Green
            Mood::NEUTRAL  => "\e[38;5;75m",   // Blue
            Mood::BAD      => "\e[38;5;208m",  // Orange
            Mood::TERRIBLE => "\e[38;5;196m",  // Red
        };
    }

    /**
     * Create a Mood from a 1–5 integer score (used when user picks a score).
     */
    public static function fromScore(int $score): self
    {
        return match(true) {
            $score >= 5 => Mood::GREAT,
            $score >= 4 => Mood::GOOD,
            $score >= 3 => Mood::NEUTRAL,
            $score >= 2 => Mood::BAD,
            default     => Mood::TERRIBLE,
        };
    }
}
