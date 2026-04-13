<?php

namespace App\UI;

use App\Helpers\Color;
use App\Models\Note;

/**
 * Premium Terminal UI Renderer
 */
class CliRenderer
{
    private const WIDTH = 80;

    public function clear(): void
    {
        if (strncasecmp(PHP_OS, 'WIN', 3) === 0) {
            system('cls');
        } else {
            system('clear');
        }
    }

    public function hr(string $char = '─', string $color = Color::GRAY): void
    {
        echo Color::apply(str_repeat($char, self::WIDTH), $color) . PHP_EOL;
    }

    public function header(string $title): void
    {
        $this->hr('━', Color::B_BLUE);
        $title = "  " . strtoupper($title) . "  ";
        $padding = max(0, (self::WIDTH - strlen($title)) / 2);
        echo str_repeat(' ', (int)$padding) . Color::header($title) . PHP_EOL;
        $this->hr('━', Color::B_BLUE);
    }

    public function box(string $content, string $title = '', string $color = Color::CYAN): void
    {
        $lines = explode(PHP_EOL, wordwrap($content, self::WIDTH - 4, PHP_EOL, true));
        
        echo Color::apply("┌─ " . ($title ?: "Message") . " " . str_repeat('─', max(0, self::WIDTH - strlen($title) - 5)) . "┐", $color) . PHP_EOL;
        foreach ($lines as $line) {
            echo Color::apply("│ ", $color) . str_pad($line, self::WIDTH - 4) . Color::apply(" │", $color) . PHP_EOL;
        }
        echo Color::apply("└" . str_repeat('─', self::WIDTH - 2) . "┘", $color) . PHP_EOL;
    }

    public function renderNote(Note $note): void
    {
        $pinned = $note->pinned ? Color::apply(" [PINNED] ", Color::B_YELLOW) : "";
        $fav = $note->favorite ? Color::apply(" [★] ", Color::B_RED) : "";
        $status = strtoupper($note->status);
        
        $color = Color::B_CYAN;
        if ($note->status === 'archived') $color = Color::YELLOW;
        if ($note->status === 'trashed') $color = Color::RED;

        echo Color::apply("ID: {$note->id} | {$note->title}", $color, true) . $pinned . $fav . PHP_EOL;
        echo Color::apply("Tags: " . implode(', ', $note->tags), Color::GRAY) . " | Category: " . $note->category . PHP_EOL;
        echo Color::apply("Created: {$note->created_at} | Updated: {$note->updated_at}", Color::GRAY) . PHP_EOL;
        $this->hr('┄');
        echo wordwrap($note->content, self::WIDTH) . PHP_EOL;
        $this->hr();
    }

    public function table(array $headers, array $rows): void
    {
        // Simple table implementation
        foreach ($headers as $h) {
            echo Color::apply(str_pad($h, 15), Color::WHITE, true);
        }
        echo PHP_EOL . str_repeat('─', self::WIDTH) . PHP_EOL;

        foreach ($rows as $row) {
            foreach ($row as $cell) {
                echo str_pad((string)$cell, 15);
            }
            echo PHP_EOL;
        }
    }

    public function dashboard(array $stats, array $latestNotes): void
    {
        $this->clear();
        echo Color::apply("
   █▄ █ █▀█ ▀█▀ █▀▀ █▀▀    ▄▀█ █▀█ █▀█
   █ ▀█ █▄█  █  ██▄ ▄██    █▀█ █▀▀ █▀▀", Color::B_BLUE, true) . PHP_EOL;
        
        $this->header("Dashboard Summary");
        
        $statsContent = sprintf(
            "Total: %d | Active: %d | Archived: %d | Trashed: %d | Favs: %d | Pinned: %d",
            $stats['total'], $stats['active'], $stats['archived'], $stats['trashed'], $stats['favorites'], $stats['pinned']
        );
        $this->box($statsContent, "STATISTICS", Color::GREEN);

        echo PHP_EOL . Color::bold("RECENT NOTES") . PHP_EOL;
        $this->hr('─', Color::GRAY);
        if (empty($latestNotes)) {
            echo Color::apply("No notes found. Create your first note!", Color::GRAY) . PHP_EOL;
        } else {
            foreach ($latestNotes as $note) {
                $p = $note->pinned ? "P " : "  ";
                $f = $note->favorite ? "★ " : "  ";
                echo sprintf("[%2d] %s%s %-40s | %s", $note->id, $p, $f, $note->title, $note->created_at) . PHP_EOL;
            }
        }
        $this->hr('─', Color::GRAY);
        
        echo PHP_EOL . Color::apply("HELP: 'help' to see all commands. | 'exit' to quit.", Color::YELLOW) . PHP_EOL;
    }
}
