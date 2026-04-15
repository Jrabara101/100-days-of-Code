<?php

/**
 * Terminal.php
 * 
 * Handles all terminal output: colors, banners, menus, tables,
 * status messages, and user input prompts.
 * 
 * This class is the single source of truth for CLI formatting.
 */
class Terminal
{
    // ─── ANSI Color & Style Codes ──────────────────────────────────
    const RESET     = "\033[0m";
    const BOLD      = "\033[1m";
    const DIM       = "\033[2m";

    // Foreground colors
    const FG_BLACK  = "\033[30m";
    const FG_RED    = "\033[31m";
    const FG_GREEN  = "\033[32m";
    const FG_YELLOW = "\033[33m";
    const FG_BLUE   = "\033[34m";
    const FG_MAGENTA= "\033[35m";
    const FG_CYAN   = "\033[36m";
    const FG_WHITE  = "\033[97m";

    // Background colors
    const BG_BLACK  = "\033[40m";
    const BG_BLUE   = "\033[44m";
    const BG_CYAN   = "\033[46m";

    // ─── Screen Control ────────────────────────────────────────────

    /**
     * Clears the terminal screen (cross-platform).
     */
    public function clear(): void
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            system('cls');
        } else {
            system('clear');
        }
    }

    // ─── Banner & Headers ──────────────────────────────────────────

    /**
     * Displays the welcome banner shown at startup.
     */
    public function showBanner(): void
    {
        $this->clear();
        echo self::FG_CYAN . self::BOLD;
        echo "╔══════════════════════════════════════════════════════╗\n";
        echo "║                                                      ║\n";
        echo "║        📄  PHP CSV READER & WRITER  📄               ║\n";
        echo "║                                                      ║\n";
        echo "║     Create · Read · Overwrite · Append CSV files     ║\n";
        echo "║                                                      ║\n";
        echo "╚══════════════════════════════════════════════════════╝\n";
        echo self::RESET;
        echo self::DIM . "  Version 1.0.0  |  Plain PHP CLI  |  100 Days of Code\n" . self::RESET;
        $this->divider();
    }

    /**
     * Prints a section header with a title.
     *
     * @param string $title  The section title text
     */
    public function header(string $title): void
    {
        $width = 54;
        $padded = str_pad(" $title ", $width, "─", STR_PAD_BOTH);
        echo "\n" . self::FG_CYAN . self::BOLD . $padded . self::RESET . "\n\n";
    }

    /**
     * Prints a simple horizontal divider line.
     */
    public function divider(): void
    {
        echo self::DIM . str_repeat("─", 54) . self::RESET . "\n";
    }

    // ─── Menu ──────────────────────────────────────────────────────

    /**
     * Renders the main navigation menu and returns the user's choice.
     *
     * @return string  The raw input from the user
     */
    public function showMenu(): string
    {
        echo "\n";
        echo self::FG_YELLOW . self::BOLD . "  ┌─ MAIN MENU ───────────────────────────────┐\n" . self::RESET;
        echo self::FG_YELLOW . "  │\n" . self::RESET;
        $this->menuItem('1', 'Create CSV File');
        $this->menuItem('2', 'Read CSV File');
        $this->menuItem('3', 'Overwrite CSV File');
        $this->menuItem('4', 'Append Row(s) to CSV');
        $this->menuItem('5', 'Exit');
        echo self::FG_YELLOW . "  │\n" . self::RESET;
        echo self::FG_YELLOW . self::BOLD . "  └────────────────────────────────────────────┘\n" . self::RESET;
        echo "\n";

        return $this->prompt("  Enter your choice [1-5]");
    }

    /**
     * Renders a single menu item line.
     *
     * @param string $key    The shortcut key/number
     * @param string $label  The menu item label
     */
    private function menuItem(string $key, string $label): void
    {
        echo self::FG_YELLOW . "  │  " . self::RESET;
        echo self::FG_CYAN . self::BOLD . "[$key]" . self::RESET;
        echo "  $label\n";
    }

    // ─── Input Prompts ─────────────────────────────────────────────

    /**
     * Displays a styled prompt and returns the trimmed user input.
     *
     * @param string $message  Prompt message shown to the user
     * @return string          Trimmed user input
     */
    public function prompt(string $message): string
    {
        echo self::FG_BLUE . self::BOLD . "$message: " . self::RESET;
        $input = fgets(STDIN);
        // Gracefully handle EOF (e.g. Ctrl+D on Unix)
        if ($input === false) {
            return '';
        }
        return trim($input);
    }

    /**
     * Prompts the user and retries until the validation callback returns true.
     *
     * @param string   $message            Prompt message
     * @param callable $validationCallback A callable that returns true or an error string
     * @param bool     $isOptional         If true, empty input is accepted immediately
     * @return string                       The validated input value
     */
    public function promptAndValidate(string $message, callable $validationCallback, bool $isOptional = false): string
    {
        while (true) {
            $input = $this->prompt($message);

            // Optional fields: allow empty input to pass through
            if ($isOptional && $input === '') {
                return '';
            }

            $result = $validationCallback($input);
            if ($result === true) {
                return $input;
            }

            // Show the validation error and ask again
            $this->warn($result);
        }
    }

    /**
     * Prompt that keeps asking until the user enters 'y' or 'n'.
     *
     * @param string $message Confirmation question
     * @return bool           true if user confirmed (y), false if declined (n)
     */
    public function confirm(string $message): bool
    {
        while (true) {
            $input = strtolower($this->prompt("$message (y/n)"));
            if ($input === 'y' || $input === 'yes') {
                return true;
            } elseif ($input === 'n' || $input === 'no') {
                return false;
            }
            $this->warn("Please enter 'y' for Yes or 'n' for No.");
        }
    }

    /**
     * Pauses execution and waits for the user to press Enter.
     */
    public function pause(): void
    {
        echo "\n" . self::DIM . "  Press [Enter] to return to the main menu..." . self::RESET;
        fgets(STDIN);
    }

    // ─── Status Messages ───────────────────────────────────────────

    /**
     * Prints a [SUCCESS] message in green.
     *
     * @param string $message
     */
    public function success(string $message): void
    {
        echo "\n" . self::FG_GREEN . self::BOLD . "  ✔  [SUCCESS]" . self::RESET;
        echo self::FG_GREEN . " $message" . self::RESET . "\n";
    }

    /**
     * Prints an [ERROR] message in red.
     *
     * @param string $message
     */
    public function error(string $message): void
    {
        echo "\n" . self::FG_RED . self::BOLD . "  ✘  [ERROR]" . self::RESET;
        echo self::FG_RED . " $message" . self::RESET . "\n";
    }

    /**
     * Prints a [WARNING] message in yellow.
     *
     * @param string $message
     */
    public function warn(string $message): void
    {
        echo self::FG_YELLOW . "  ⚠  [WARNING] $message" . self::RESET . "\n";
    }

    /**
     * Prints an [INFO] message in cyan.
     *
     * @param string $message
     */
    public function info(string $message): void
    {
        echo self::FG_CYAN . "  ℹ  [INFO] $message" . self::RESET . "\n";
    }

    // ─── Table Renderer ────────────────────────────────────────────

    /**
     * Renders a 2D array (rows) as a formatted table with headers.
     *
     * Algorithm:
     *  1. Calculate the maximum width of each column across all rows + header
     *  2. Build top, separator, and bottom border strings
     *  3. Print header row, then data rows with dividers
     *
     * @param array $headers  Column header labels
     * @param array $rows     2D array of data rows (each row is an indexed array)
     */
    public function renderTable(array $headers, array $rows): void
    {
        if (empty($headers)) {
            $this->warn("No columns to display.");
            return;
        }

        // Step 1: calculate column widths (minimum: header label width)
        $colWidths = [];
        foreach ($headers as $i => $header) {
            $colWidths[$i] = mb_strlen($header);
        }
        foreach ($rows as $row) {
            foreach ($headers as $i => $header) {
                $cell = isset($row[$i]) ? (string)$row[$i] : '';
                $colWidths[$i] = max($colWidths[$i], mb_strlen($cell));
            }
        }

        // Step 2: build the border / separator line
        $buildBorder = function (string $left, string $mid, string $right, string $fill) use ($colWidths): string {
            $segments = array_map(fn($w) => str_repeat($fill, $w + 2), $colWidths);
            return $left . implode($mid, $segments) . $right;
        };

        $topBorder  = $buildBorder('╔', '╦', '╗', '═');
        $midDivider = $buildBorder('╠', '╬', '╣', '═');
        $btmBorder  = $buildBorder('╚', '╩', '╝', '═');

        // Helper: format a single row into a table row string
        $formatRow = function (array $cells, string $color = '') use ($colWidths): string {
            $parts = [];
            foreach ($colWidths as $i => $width) {
                $cell = isset($cells[$i]) ? (string)$cells[$i] : '';
                $parts[] = ' ' . mb_str_pad($cell, $width) . ' ';
            }
            return '║' . implode('║', $parts) . '║';
        };

        // Step 3: Print the table
        echo "\n";
        echo self::FG_CYAN . $topBorder . self::RESET . "\n";

        // Header row (bold white)
        echo self::FG_CYAN . '║' . self::RESET;
        foreach ($colWidths as $i => $width) {
            $label = isset($headers[$i]) ? $headers[$i] : '';
            echo self::FG_WHITE . self::BOLD . ' ' . mb_str_pad($label, $width) . ' ' . self::RESET;
            echo self::FG_CYAN . '║' . self::RESET;
        }
        echo "\n";

        echo self::FG_CYAN . $midDivider . self::RESET . "\n";

        // Data rows
        if (empty($rows)) {
            // No data: show an empty state row
            $totalWidth = array_sum($colWidths) + (count($colWidths) * 3) + 1;
            $emptyMsg   = str_pad(' (No records found) ', $totalWidth - 2, ' ', STR_PAD_BOTH);
            echo self::FG_CYAN . '║' . self::RESET;
            echo self::FG_YELLOW . self::DIM . $emptyMsg . self::RESET;
            echo self::FG_CYAN . '║' . self::RESET . "\n";
        } else {
            foreach ($rows as $rowIndex => $row) {
                // Alternate row background tint via dim
                $isAlt = ($rowIndex % 2 === 1);
                echo self::FG_CYAN . '║' . self::RESET;
                foreach ($colWidths as $i => $width) {
                    $cell = isset($row[$i]) ? (string)$row[$i] : '';
                    $text = ' ' . mb_str_pad($cell, $width) . ' ';
                    echo ($isAlt ? self::DIM : '') . $text . self::RESET;
                    echo self::FG_CYAN . '║' . self::RESET;
                }
                echo "\n";
            }
        }

        echo self::FG_CYAN . $btmBorder . self::RESET . "\n";

        // Row count summary
        $count = count($rows);
        echo self::DIM . "  Showing $count record(s).\n" . self::RESET;
    }
}
