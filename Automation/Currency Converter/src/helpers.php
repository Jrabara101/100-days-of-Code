<?php

declare(strict_types=1);

/**
 * helpers.php — Reusable CLI styling and utility functions.
 *
 * These are global helper functions available throughout the application.
 * They wrap raw ANSI output and provide terminal layout primitives.
 */

// ── ANSI Color Constants ──────────────────────────────────────────────────────

const ANSI_RESET   = "\033[0m";
const ANSI_BOLD    = "\033[1m";
const ANSI_DIM     = "\033[2m";

// Foreground colors
const ANSI_BLACK   = "\033[30m";
const ANSI_RED     = "\033[31m";
const ANSI_GREEN   = "\033[32m";
const ANSI_YELLOW  = "\033[33m";
const ANSI_BLUE    = "\033[34m";
const ANSI_MAGENTA = "\033[35m";
const ANSI_CYAN    = "\033[36m";
const ANSI_WHITE   = "\033[37m";

// Bright foreground colors
const ANSI_BRIGHT_RED     = "\033[91m";
const ANSI_BRIGHT_GREEN   = "\033[92m";
const ANSI_BRIGHT_YELLOW  = "\033[93m";
const ANSI_BRIGHT_BLUE    = "\033[94m";
const ANSI_BRIGHT_MAGENTA = "\033[95m";
const ANSI_BRIGHT_CYAN    = "\033[96m";
const ANSI_BRIGHT_WHITE   = "\033[97m";

// Background colors
const ANSI_BG_RED    = "\033[41m";
const ANSI_BG_GREEN  = "\033[42m";
const ANSI_BG_YELLOW = "\033[43m";
const ANSI_BG_BLUE   = "\033[44m";
const ANSI_BG_CYAN   = "\033[46m";

// Box-drawing characters
const BOX_TL = '╔';
const BOX_TR = '╗';
const BOX_BL = '╚';
const BOX_BR = '╝';
const BOX_H  = '═';
const BOX_V  = '║';
const BOX_ML = '╠';
const BOX_MR = '╣';
const THIN_H = '─';

// ── Box Width ─────────────────────────────────────────────────────────────────

const BOX_WIDTH = 46;

// ── Color Helpers ─────────────────────────────────────────────────────────────

/**
 * Wrap text in an ANSI color code.
 */
function color(string $text, string $ansiCode): string
{
    return $ansiCode . $text . ANSI_RESET;
}

/**
 * Return bold text.
 */
function bold(string $text): string
{
    return ANSI_BOLD . $text . ANSI_RESET;
}

// ── Print Helpers ─────────────────────────────────────────────────────────────

/**
 * Print a line to stdout, with optional trailing newline.
 */
function out(string $line = '', bool $newline = true): void
{
    echo $line . ($newline ? PHP_EOL : '');
}

/**
 * Print a blank line.
 */
function blank(): void
{
    echo PHP_EOL;
}

/**
 * Colorized print with optional bold.
 */
function cprint(string $text, string $ansiCode, bool $bold = false): void
{
    $prefix = $bold ? ANSI_BOLD : '';
    echo $prefix . $ansiCode . $text . ANSI_RESET . PHP_EOL;
}

// ── Box Builders ──────────────────────────────────────────────────────────────

/**
 * Return a centered string padded to $width.
 */
function center_text(string $text, int $width): string
{
    $len = mb_strlen($text);
    $pad = max(0, (int) floor(($width - $len) / 2));
    return str_repeat(' ', $pad) . $text . str_repeat(' ', $width - $pad - $len);
}

/**
 * Draw the top border of a double-line box.
 */
function box_top(int $width = BOX_WIDTH): void
{
    out(ANSI_CYAN . BOX_TL . str_repeat(BOX_H, $width - 2) . BOX_TR . ANSI_RESET);
}

/**
 * Draw the bottom border of a double-line box.
 */
function box_bottom(int $width = BOX_WIDTH): void
{
    out(ANSI_CYAN . BOX_BL . str_repeat(BOX_H, $width - 2) . BOX_BR . ANSI_RESET);
}

/**
 * Draw a middle divider of a double-line box.
 */
function box_divider(int $width = BOX_WIDTH): void
{
    out(ANSI_CYAN . BOX_ML . str_repeat(BOX_H, $width - 2) . BOX_MR . ANSI_RESET);
}

/**
 * Draw a single box row with $content inside vertical borders.
 * Content should already be the right length (padded manually if needed).
 */
function box_row(string $content, int $width = BOX_WIDTH): void
{
    $inner = $width - 2;
    // Strip ANSI codes to get visual length for padding
    $visual = preg_replace('/\033\[[0-9;]*m/', '', $content);
    $visualLen = mb_strlen($visual);
    $padding = max(0, $inner - $visualLen);
    out(ANSI_CYAN . BOX_V . ANSI_RESET . $content . str_repeat(' ', $padding) . ANSI_CYAN . BOX_V . ANSI_RESET);
}

/**
 * Draw an empty box row (blank line inside box).
 */
function box_empty(int $width = BOX_WIDTH): void
{
    out(ANSI_CYAN . BOX_V . str_repeat(' ', $width - 2) . BOX_V . ANSI_RESET);
}

// ── Status Messages ───────────────────────────────────────────────────────────

/**
 * Print a success message with green check mark.
 */
function msg_success(string $message): void
{
    out('  ' . ANSI_BRIGHT_GREEN . ANSI_BOLD . '  ✔  ' . $message . ANSI_RESET);
}

/**
 * Print a warning message with yellow triangle.
 */
function msg_warning(string $message): void
{
    out('  ' . ANSI_BRIGHT_YELLOW . ANSI_BOLD . '  ⚠  ' . $message . ANSI_RESET);
}

/**
 * Print an error message with red X.
 */
function msg_error(string $message): void
{
    out('  ' . ANSI_BRIGHT_RED . ANSI_BOLD . '  ✖  ' . $message . ANSI_RESET);
}

/**
 * Print an info message with cyan circle.
 */
function msg_info(string $message): void
{
    out('  ' . ANSI_CYAN . '  ℹ  ' . $message . ANSI_RESET);
}

// ── Inline Loading Spinner ─────────────────────────────────────────────────────

/**
 * Display a simple animated loading indicator.
 * Runs for $iterations steps, then clears the line.
 */
function loading_spinner(string $message = 'Fetching exchange rates', int $iterations = 12): void
{
    $frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    for ($i = 0; $i < $iterations; $i++) {
        $frame = $frames[$i % count($frames)];
        echo "\r  " . ANSI_BRIGHT_CYAN . $frame . ANSI_RESET . '  ' . ANSI_CYAN . $message . '...' . ANSI_RESET;
        usleep(80000); // 80ms per frame
    }
    // Clear the spinner line
    echo "\r" . str_repeat(' ', mb_strlen("  {$frame}  {$message}...") + 5) . "\r";
}

// ── Input Helpers ─────────────────────────────────────────────────────────────

/**
 * Read a line from stdin, trimmed. Returns empty string on EOF.
 */
function read_input(string $prompt): string
{
    echo '  ' . ANSI_BRIGHT_YELLOW . '▶' . ANSI_RESET . '  ' . $prompt . ' ';
    $line = fgets(STDIN);
    return trim($line === false ? '' : $line);
}

/**
 * Read a line and convert to uppercase (for currency codes).
 */
function read_currency_code(string $prompt): string
{
    return strtoupper(read_input($prompt));
}

// ── Separator ─────────────────────────────────────────────────────────────────

/**
 * Print a thin horizontal separator line.
 */
function separator(int $width = BOX_WIDTH): void
{
    out(ANSI_DIM . str_repeat(THIN_H, $width) . ANSI_RESET);
}

// ── Number Formatting ─────────────────────────────────────────────────────────

/**
 * Format a number with thousands separator and $decimals decimal places.
 */
function format_amount(float $amount, int $decimals = 2): string
{
    return number_format($amount, $decimals, '.', ',');
}

/**
 * Clear the terminal screen.
 */
function clear_screen(): void
{
    // Works on Windows (cmd/pwsh) and *nix
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        system('cls');
    } else {
        system('clear');
    }
}
