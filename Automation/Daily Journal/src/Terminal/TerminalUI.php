<?php

declare(strict_types=1);

namespace ChronoVault\Terminal;

use ChronoVault\Domain\JournalEntry;
use ChronoVault\Domain\Mood;

/**
 * TerminalUI — ANSI 24-bit color terminal rendering engine.
 *
 * ARCHITECTURAL REASONING:
 * ─────────────────────────────────────────────────────────────────────
 * All terminal output is centralized here. No other class writes directly
 * to stdout. Benefits:
 *   1. Testability: Commands don't directly emit I/O
 *   2. Theming: Change the color palette in one place
 *   3. Platform handling: ANSI detection & stripping in one place
 *
 * ANSI ESCAPE SEQUENCES USED:
 *   \e[38;2;R;G;Bm  → 24-bit foreground (true color RGB)
 *   \e[48;2;R;G;Bm  → 24-bit background
 *   \e[38;5;Nm      → 256-color palette foreground
 *   \e[1m           → Bold
 *   \e[2m           → Dim
 *   \e[0m           → Reset all attributes
 *   \e[A            → Move cursor up 1 line (used for password masking)
 *
 * PASSWORD MASKING:
 * We use a combination of stty -echo (Unix) / the PowerShell equivalent
 * to suppress terminal echo while the user types their passphrase.
 * The prompt re-renders asterisks to confirm input is being received
 * without revealing the actual characters.
 */
class TerminalUI
{
    // ── Color Palette (ANSI 256-color codes) ─────────────────────────────────
    private const C_RESET   = "\e[0m";
    private const C_BOLD    = "\e[1m";
    private const C_DIM     = "\e[2m";

    // Brand purple
    private const C_BRAND   = "\e[38;2;147;112;219m";   // Medium Purple
    private const C_BRAND2  = "\e[38;2;180;140;255m";   // Lighter lavender
    // Accent gold
    private const C_GOLD    = "\e[38;2;255;200;80m";
    // Status colors
    private const C_GREEN   = "\e[38;2;80;220;140m";
    private const C_RED     = "\e[38;2;255;90;90m";
    private const C_ORANGE  = "\e[38;2;255;160;70m";
    private const C_BLUE    = "\e[38;2;100;160;255m";
    // Text tones
    private const C_WHITE   = "\e[38;2;230;230;240m";
    private const C_MUTED   = "\e[38;2;120;120;150m";
    private const C_SUBTLE  = "\e[38;2;80;80;110m";
    // Background
    private const C_BG_HEADER = "\e[48;2;20;18;40m";
    private const C_BG_ROW_ALT = "\e[48;2;22;20;38m";

    // ── Separator widths ──────────────────────────────────────────────────────
    private const WIDTH   = 72;
    private const DIVIDER = '═';
    private const THIN    = '─';

    /**
     * Prompts the user to enter their master passphrase with echo disabled.
     * Returns the passphrase string.
     *
     * SECURITY: Uses stty on Unix or PowerShell's Read-Host -AsSecureString
     * on Windows to suppress terminal echo. The entered characters are never
     * displayed. A fixed "●●●●●●" placeholder shows input is happening.
     */
    public function promptPassphrase(bool $isNewVault = false): string
    {
        $label = $isNewVault
            ? self::C_GOLD . '  🔑 Create master passphrase: ' . self::C_RESET
            : self::C_GOLD . '  🔐 Enter master passphrase : ' . self::C_RESET;

        echo $label;

        $passphrase = $this->readSecretInput();

        echo PHP_EOL;
        return $passphrase;
    }

    /**
     * Reads a line of input with echo suppressed.
     * Cross-platform: stty on Unix, mode con on Windows (best-effort).
     */
    private function readSecretInput(): string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            // On Windows, use PowerShell to read masked input if available.
            // Fallback: plain readline (no masking, but still functional).
            $output = [];
            exec('powershell -Command "[Console]::ReadLine()" 2>NUL', $output, $rc);
            if ($rc === 0 && isset($output[0])) {
                return $output[0];
            }
            // Absolute fallback for Windows without PowerShell.
            return (string) readline('');
        }

        // Unix: disable echo via stty, read, re-enable.
        $stty = shell_exec('stty -g 2>/dev/null');
        system('stty -echo');

        $input = '';
        while (true) {
            $char = fread(STDIN, 1);
            if ($char === false || $char === "\n" || $char === "\r") {
                break;
            }
            // Handle backspace.
            if (ord($char) === 127 || ord($char) === 8) {
                if (!empty($input)) {
                    $input = substr($input, 0, -1);
                    echo "\e[1D \e[1D"; // Erase last asterisk
                }
                continue;
            }
            $input .= $char;
            echo '●'; // Show a dot per character — visible feedback without revealing chars.
        }

        // Restore terminal to previous stty settings.
        if ($stty !== null) {
            system('stty ' . escapeshellarg(trim($stty)));
        } else {
            system('stty echo');
        }

        return $input;
    }

    /**
     * Renders the full ChronoVault dashboard.
     */
    public function renderDashboard(
        int $streak,
        int $totalWords,
        ?Mood $currentMood,
        array $recentEntries,
        array $last7DaysMoods, // ['Mon' => Mood|null, 'Tue' => ...]
    ): void {
        $this->renderAppHeader();
        $this->renderVaultStatus($streak, $totalWords, $currentMood);
        $this->renderMoodTrend7Days($last7DaysMoods);
        $this->renderEntryTable($recentEntries);
        $this->renderFooterHint();
    }

    /**
     * Renders the ChronoVault ASCII application header.
     */
    public function renderAppHeader(): void
    {
        $eq = str_repeat(self::DIVIDER, self::WIDTH);
        echo PHP_EOL;
        echo self::C_BG_HEADER . self::C_BRAND . self::C_BOLD;
        echo "  ██████╗██╗  ██╗██████╗  ██████╗ ███╗   ██╗ ██████╗ " . self::C_RESET . PHP_EOL;
        echo self::C_BG_HEADER . self::C_BRAND . self::C_BOLD;
        echo " ██╔════╝██║  ██║██╔══██╗██╔═══██╗████╗  ██║██╔═══██╗" . self::C_RESET . PHP_EOL;
        echo self::C_BG_HEADER . self::C_BRAND2 . self::C_BOLD;
        echo " ██║     ███████║██████╔╝██║   ██║██╔██╗ ██║██║   ██║" . self::C_RESET . PHP_EOL;
        echo self::C_BG_HEADER . self::C_BRAND2 . self::C_BOLD;
        echo " ██║     ██╔══██║██╔══██╗██║   ██║██║╚██╗██║██║   ██║" . self::C_RESET . PHP_EOL;
        echo self::C_BG_HEADER . self::C_BRAND . self::C_BOLD;
        echo " ╚██████╗██║  ██║██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝" . self::C_RESET . PHP_EOL;
        echo self::C_BG_HEADER . self::C_BRAND . self::C_BOLD;
        echo "  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ " . self::C_RESET . PHP_EOL;
        echo PHP_EOL;
        echo self::C_MUTED . "  ChronoVault v1.0.3  " . self::C_SUBTLE . "[Engine: PHP " . PHP_VERSION . " | Cipher: XChaCha20-Poly1305]" . self::C_RESET . PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::DIVIDER, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
    }

    /**
     * Renders the vault status bar with streak, total words, and current mood.
     */
    public function renderVaultStatus(int $streak, int $totalWords, ?Mood $currentMood): void
    {
        $moodDisplay = $currentMood
            ? $currentMood->ansiColor() . $currentMood->emoji() . ' ' . $currentMood->label() . self::C_RESET
            : self::C_MUTED . '—' . self::C_RESET;

        echo PHP_EOL;
        echo self::C_GREEN . self::C_BOLD . "  [ 🔒 VAULT UNLOCKED ]" . self::C_RESET;
        echo self::C_WHITE . " Welcome back." . self::C_RESET . PHP_EOL;
        echo PHP_EOL;

        $streakFire = $streak > 0 ? "🔥 {$streak} Day" . ($streak === 1 ? '' : 's') : '—';
        $this->statRow('Current Streak', $streakFire, self::C_GOLD);
        $this->statRow('Total Words',    number_format($totalWords), self::C_BLUE);
        $this->statRow('Current Mood',   "[ {$moodDisplay} ]", '');

        echo PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::DIVIDER, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
    }

    /**
     * Renders the 7-day mood sparkline chart (row-based ASCII grid).
     *
     * RENDERING STRATEGY:
     * We render the chart row-by-row from top (GREAT) to bottom (TERRIBLE).
     * For each mood level, we scan each day and place a 🔵 dot if that day's
     * mood matches (or rounds to) that level.
     *
     * @param array $days  Ordered array: ['Mon' => Mood|null, ...]
     */
    public function renderMoodTrend7Days(array $days): void
    {
        echo PHP_EOL;
        echo self::C_WHITE . self::C_BOLD . "  [ MOOD TREND: LAST 7 DAYS ]" . self::C_RESET . PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::THIN, self::WIDTH - 2) . self::C_RESET . PHP_EOL;

        $levels = [
            Mood::GREAT    => 'Awesome',
            Mood::GOOD     => 'Good   ',
            Mood::NEUTRAL  => 'Neutral',
            Mood::BAD      => 'Bad    ',
            Mood::TERRIBLE => 'Awful  ',
        ];

        $dayKeys = array_keys($days);

        foreach ($levels as $mood => $label) {
            $row = sprintf('  %s%s%-9s%s|', $mood->ansiColor(), self::C_BOLD, $label, self::C_RESET);

            foreach ($dayKeys as $day) {
                $dayMood = $days[$day];
                $dot     = '   ';

                if ($dayMood !== null && $dayMood === $mood) {
                    $dot = ' 🔵';
                } elseif ($dayMood !== null && $this->moodRoundsTo($dayMood, $mood)) {
                    $dot = ' 🔵';
                }
                $row .= $dot . ' ';
            }

            echo $row . self::C_RESET . PHP_EOL;
        }

        // Day labels row.
        $dayRow = '            ';
        foreach ($dayKeys as $day) {
            $dayRow .= sprintf('%-5s', $day);
        }
        echo self::C_MUTED . $dayRow . self::C_RESET . PHP_EOL;
        echo PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::DIVIDER, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
    }

    /**
     * Renders the 30-day mood bar chart for the stats command.
     *
     * @param array $moodScores  Date => float|null score (1.0–5.0 or null)
     */
    public function renderMoodChart30Days(array $moodScores): void
    {
        echo PHP_EOL;
        echo self::C_WHITE . self::C_BOLD . "  [ MOOD CHART: LAST 30 DAYS ]" . self::C_RESET . PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::THIN, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
        echo PHP_EOL;

        // Sparkline using block characters ▁▂▃▄▅▆▇█
        $blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

        echo '  ';
        foreach (array_reverse(array_values($moodScores)) as $score) {
            if ($score === null) {
                echo self::C_MUTED . '░' . self::C_RESET;
            } else {
                // Map score 1–5 to block index 0–7.
                $blockIndex = (int) round(($score - 1) / 4 * 7);
                $blockIndex = max(0, min(7, $blockIndex));
                $mood       = Mood::fromScore((int) round($score));
                echo $mood->ansiColor() . $blocks[$blockIndex] . self::C_RESET;
            }
        }
        echo PHP_EOL . PHP_EOL;

        // Scale legend
        echo self::C_MUTED . "  ← 30 days ago" . str_repeat(' ', 40) . "Today →" . self::C_RESET . PHP_EOL;
        echo self::C_SUBTLE . "  Legend: ";
        foreach ([Mood::TERRIBLE, Mood::BAD, Mood::NEUTRAL, Mood::GOOD, Mood::GREAT] as $m) {
            echo $m->ansiColor() . $m->emoji() . ' ' . $m->label() . '  ' . self::C_RESET;
        }
        echo PHP_EOL;
    }

    /**
     * Renders a tabular list of journal entries.
     *
     * @param JournalEntry[] $entries
     */
    public function renderEntryTable(array $entries): void
    {
        echo PHP_EOL;
        echo self::C_WHITE . self::C_BOLD . "  [ RECENT ENTRIES ]" . self::C_RESET . PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::THIN, self::WIDTH - 2) . self::C_RESET . PHP_EOL;

        // Header row
        echo self::C_MUTED . self::C_BOLD;
        printf(
            "  %-6s  %-12s  %-22s  %-6s  %s\n",
            'ID', 'Date', 'Tags', 'Words', 'Mood'
        );
        echo self::C_SUBTLE . "  " . str_repeat(self::THIN, self::WIDTH - 2) . self::C_RESET . PHP_EOL;

        foreach ($entries as $i => $entry) {
            // Alternating row background — uses ANSI clear-to-EOL with background.
            $rowBg = ($i % 2 === 1) ? self::C_BG_ROW_ALT : '';
            $reset = self::C_RESET;

            $tags     = mb_strimwidth($entry->tagsForDisplay(), 0, 21, '…');
            $moodStr  = $entry->mood->emoji() . ' ' . $entry->mood->label();

            echo $rowBg;
            printf(
                "  \e[38;2;147;112;219m%-6s\e[0m%s  \e[38;2;180;180;210m%-12s\e[0m%s  \e[38;2;120;200;160m%-22s\e[0m%s  \e[38;2;100;160;255m%-6s\e[0m%s  %s%s\n",
                $entry->formattedId(),   $rowBg,
                $entry->date,            $rowBg,
                $tags,                   $rowBg,
                number_format($entry->wordCount), $rowBg,
                $entry->mood->ansiColor() . $moodStr, $reset,
            );
        }

        echo self::C_SUBTLE . "  " . str_repeat(self::THIN, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
    }

    /**
     * Renders a single decrypted journal entry in a reading view.
     */
    public function renderEntry(JournalEntry $entry): void
    {
        $eq = str_repeat(self::DIVIDER, self::WIDTH);

        echo PHP_EOL;
        echo self::C_SUBTLE . "  {$eq}" . self::C_RESET . PHP_EOL;
        echo self::C_BRAND . self::C_BOLD . "  ENTRY " . $entry->formattedId() . self::C_RESET;
        echo self::C_MUTED . "  ·  " . $entry->date . self::C_RESET;
        echo self::C_MUTED . "  ·  " . $entry->mood->ansiColor() . $entry->mood->emoji() . ' ' . $entry->mood->label() . self::C_RESET;
        echo PHP_EOL;

        if (!empty($entry->tags)) {
            echo self::C_MUTED . "  Tags: " . self::C_GREEN . implode(' ', $entry->tags) . self::C_RESET . PHP_EOL;
        }
        echo self::C_MUTED . "  Words: " . self::C_BLUE . number_format($entry->wordCount) . self::C_RESET . PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::THIN, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
        echo PHP_EOL;

        // Word-wrap the body to terminal width.
        $wrapped = wordwrap($entry->body, self::WIDTH - 4, PHP_EOL, false);
        $lines   = explode(PHP_EOL, $wrapped);
        foreach ($lines as $line) {
            echo self::C_WHITE . "  " . $line . self::C_RESET . PHP_EOL;
        }

        echo PHP_EOL;
        echo self::C_SUBTLE . "  {$eq}" . self::C_RESET . PHP_EOL;
    }

    /**
     * Renders the stats panel with streaks and charts.
     */
    public function renderStatsPanel(
        int   $currentStreak,
        int   $longestStreak,
        int   $totalEntries,
        int   $totalWords,
        array $moodScores,
        array $allEntries,
    ): void {
        $this->renderAppHeader();

        echo PHP_EOL;
        echo self::C_WHITE . self::C_BOLD . "  [ VAULT ANALYTICS ]" . self::C_RESET . PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::THIN, self::WIDTH - 2) . self::C_RESET . PHP_EOL;

        $this->statRow('Current Streak', "🔥 {$currentStreak} Day" . ($currentStreak === 1 ? '' : 's'), self::C_GOLD);
        $this->statRow('Longest Streak', "⚡ {$longestStreak} Day" . ($longestStreak === 1 ? '' : 's'), self::C_BRAND2);
        $this->statRow('Total Entries',  (string) $totalEntries, self::C_GREEN);
        $this->statRow('Total Words',    number_format($totalWords), self::C_BLUE);

        if ($totalEntries > 0) {
            $avgWordsPerEntry = (int) round($totalWords / $totalEntries);
            $this->statRow('Avg Words/Entry', (string) $avgWordsPerEntry, self::C_MUTED);
        }

        echo PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::DIVIDER, self::WIDTH - 2) . self::C_RESET . PHP_EOL;

        $this->renderMoodChart30Days($moodScores);

        echo PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::DIVIDER, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
    }

    /**
     * Renders the "write" mode header.
     */
    public function writeHeader(): void
    {
        echo PHP_EOL;
        echo self::C_BRAND . self::C_BOLD . "  ✍  COMPOSE NEW ENTRY" . self::C_RESET . PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::THIN, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
    }

    /**
     * Renders a success banner after saving an entry.
     */
    public function successBanner(JournalEntry $entry): void
    {
        echo PHP_EOL;
        echo self::C_GREEN . self::C_BOLD;
        echo "  ✓ Entry " . $entry->formattedId() . " encrypted & saved successfully." . self::C_RESET . PHP_EOL;
        echo self::C_MUTED . "  Date   : " . self::C_WHITE . $entry->date . self::C_RESET . PHP_EOL;
        echo self::C_MUTED . "  Mood   : " . $entry->mood->ansiColor() . $entry->mood->emoji() . ' ' . $entry->mood->label() . self::C_RESET . PHP_EOL;
        echo self::C_MUTED . "  Words  : " . self::C_BLUE . number_format($entry->wordCount) . self::C_RESET . PHP_EOL;
        if (!empty($entry->tags)) {
            echo self::C_MUTED . "  Tags   : " . self::C_GREEN . implode(' ', $entry->tags) . self::C_RESET . PHP_EOL;
        }
        echo PHP_EOL;
    }

    /**
     * Prompts the user to select a mood score 1–5.
     */
    public function promptMood(): int
    {
        echo PHP_EOL;
        echo self::C_WHITE . self::C_BOLD . "  🎭 How are you feeling today?" . self::C_RESET . PHP_EOL;
        echo PHP_EOL;

        $options = [
            5 => Mood::GREAT,
            4 => Mood::GOOD,
            3 => Mood::NEUTRAL,
            2 => Mood::BAD,
            1 => Mood::TERRIBLE,
        ];

        foreach ($options as $score => $mood) {
            echo $mood->ansiColor() . sprintf("     [%d] %s %s", $score, $mood->emoji(), $mood->label()) . self::C_RESET . PHP_EOL;
        }

        echo PHP_EOL;

        while (true) {
            $input = $this->prompt(self::C_GOLD . "  Enter mood (1–5): " . self::C_RESET);
            $score = (int) trim($input);
            if ($score >= 1 && $score <= 5) {
                return $score;
            }
            echo self::C_RED . "  Please enter a number between 1 and 5." . self::C_RESET . PHP_EOL;
        }
    }

    /**
     * Renders the footer command hint.
     */
    public function renderFooterHint(): void
    {
        echo PHP_EOL;
        echo self::C_SUBTLE . "  " . str_repeat(self::DIVIDER, self::WIDTH - 2) . self::C_RESET . PHP_EOL;
        echo self::C_MUTED . "  > ";
        echo self::C_WHITE . "Type ";
        echo self::C_GOLD . "'cvault write'";
        echo self::C_WHITE . " to open your editor, or ";
        echo self::C_GOLD . "'cvault read #001'";
        echo self::C_WHITE . " to read an entry." . self::C_RESET . PHP_EOL;
        echo PHP_EOL;
    }

    /**
     * Generic text prompt — reads a line from STDIN.
     */
    public function prompt(string $label): string
    {
        echo $label;
        $input = fgets(STDIN);
        return $input !== false ? $input : '';
    }

    /**
     * Emits an info message with a blue [i] prefix.
     */
    public function info(string $message): void
    {
        echo self::C_BLUE . "  ℹ  " . self::C_WHITE . $message . self::C_RESET . PHP_EOL;
    }

    /**
     * Emits a warning with an orange [!] prefix.
     */
    public function warning(string $message): void
    {
        echo self::C_ORANGE . "  ⚠  " . self::C_WHITE . $message . self::C_RESET . PHP_EOL;
    }

    /**
     * Emits an error with a red [✖] prefix.
     */
    public function error(string $message): void
    {
        echo self::C_RED . "  ✖  " . $message . self::C_RESET . PHP_EOL;
    }

    /**
     * Emits a blank line.
     */
    public function newLine(int $count = 1): void
    {
        echo str_repeat(PHP_EOL, $count);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    /**
     * Renders a formatted two-column stat row.
     */
    private function statRow(string $label, string $value, string $valueColor): void
    {
        echo self::C_MUTED . sprintf("  %-16s : ", $label);
        echo $valueColor . self::C_BOLD . $value . self::C_RESET . PHP_EOL;
    }

    /**
     * Determines if a given mood "rounds to" a target mood for sparkline placement.
     * Used when multiple mood levels might share a column.
     */
    private function moodRoundsTo(Mood $actual, Mood $target): bool
    {
        return $actual === $target;
    }
}
