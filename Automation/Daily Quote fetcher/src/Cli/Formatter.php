<?php

declare(strict_types=1);

namespace DailyQuote\Cli;

use DailyQuote\Model\Quote;

/**
 * Terminal Formatter — premium coloured CLI output engine.
 *
 * Uses ANSI escape codes for cross-platform terminal styling.
 * Degrades gracefully when STDOUT is not a TTY (e.g. cron).
 */
final class Formatter
{
    private const VERSION = '1.0.0';

    // ── ANSI colour codes ──────────────────────────────────────────────────
    private const RESET   = "\033[0m";
    private const BOLD    = "\033[1m";
    private const DIM     = "\033[2m";
    private const ITALIC  = "\033[3m";

    private const FG_BLACK   = "\033[30m";
    private const FG_RED     = "\033[91m";
    private const FG_GREEN   = "\033[92m";
    private const FG_YELLOW  = "\033[93m";
    private const FG_BLUE    = "\033[94m";
    private const FG_MAGENTA = "\033[95m";
    private const FG_CYAN    = "\033[96m";
    private const FG_WHITE   = "\033[97m";

    private const BG_BLACK  = "\033[40m";
    private const BG_BLUE   = "\033[44m";
    private const BG_CYAN   = "\033[46m";

    private readonly bool $tty;

    public function __construct()
    {
        // Detect real TTY so cron logs stay clean
        $this->tty = PHP_SAPI === 'cli' && stream_isatty(STDOUT);
    }

    // ── Public interface ───────────────────────────────────────────────────

    public function printBanner(): void
    {
        $width = 64;
        $title = '  ✦  DAILY QUOTE FETCHER  ✦  ';
        $sub   = 'Powered by ZenQuotes API  |  v' . self::VERSION;

        $this->line('');
        $this->line($this->color(str_repeat('─', $width), self::FG_CYAN));
        $this->line(
            $this->color(self::BG_BLACK, self::BG_BLACK) .
            $this->color($this->bold($this->center($title, $width)), self::FG_CYAN) .
            self::RESET
        );
        $this->line($this->color($this->center($sub, $width), self::DIM . self::FG_WHITE));
        $this->line($this->color(str_repeat('─', $width), self::FG_CYAN));
        $this->line('');
    }

    public function printQuote(Quote $quote): void
    {
        $width  = 64;
        $border = $this->color('  │ ', self::FG_MAGENTA . self::BOLD);
        $pad    = $this->color('  │', self::FG_MAGENTA . self::BOLD);

        $this->line($this->color(str_repeat('─', $width), self::FG_MAGENTA . self::DIM));
        $this->line($border);

        // Word-wrap the quote text at 56 chars
        $wrapped = wordwrap($quote->text, 56, "\n", true);
        foreach (explode("\n", $wrapped) as $line) {
            $this->line($border . $this->color($this->italic('"' . $line . '"'), self::FG_WHITE . self::BOLD));
        }

        $this->line($pad);
        $this->line($border . $this->color('— ' . $quote->author, self::FG_CYAN));
        $this->line($pad);
        $this->line($border . $this->color(
            $this->dim('Fetched: ' . $quote->fetchedAt->format('D, d M Y  H:i:s T')),
            self::FG_WHITE
        ));
        $this->line($this->color(str_repeat('─', $width), self::FG_MAGENTA . self::DIM));
        $this->line('');
    }

    public function printSuccess(string $label, string $message): void
    {
        $tag = $this->color(' ✔ ' . strtoupper($label) . ' ', self::FG_BLACK . self::BG_CYAN . self::BOLD);
        $this->line($tag . ' ' . $this->color($message, self::FG_GREEN));
    }

    public function printWarning(string $label, string $message): void
    {
        $tag = $this->color(' ⚠ ' . strtoupper($label) . ' ', self::FG_BLACK . "\033[43m" . self::BOLD);
        $this->line($tag . ' ' . $this->color($message, self::FG_YELLOW));
    }

    public function printError(string $label, string $message): void
    {
        $tag = $this->color(' ✖ ' . strtoupper($label) . ' ', self::FG_WHITE . "\033[41m" . self::BOLD);
        $this->line($tag . ' ' . $this->color($message, self::FG_RED));
        $this->line('');
    }

    public function printInfo(string $message, bool $verbose): void
    {
        if (! $verbose) {
            return;
        }
        $this->line($this->color('  ℹ  ', self::FG_BLUE . self::BOLD) . $this->color($message, self::FG_WHITE));
    }

    public function printMuted(string $message, bool $verbose): void
    {
        if (! $verbose) {
            return;
        }
        $this->line($this->color($message, self::DIM));
    }

    public function printFooter(): void
    {
        $width = 64;
        $this->line('');
        $this->line($this->color(str_repeat('─', $width), self::FG_CYAN . self::DIM));
        $this->line($this->color(
            $this->center('  Run with --help for all options  ', $width),
            self::DIM
        ));
        $this->line($this->color(str_repeat('─', $width), self::FG_CYAN . self::DIM));
        $this->line('');
    }

    public function printHelp(): void
    {
        $this->printBanner();
        $g = fn(string $s) => $this->color($s, self::FG_GREEN);
        $c = fn(string $s) => $this->color($s, self::FG_CYAN);
        $d = fn(string $s) => $this->color($s, self::DIM);
        $b = fn(string $s) => $this->bold($s);

        echo <<<EOT

  {$b('USAGE')}
    php bin/quote.php [OPTIONS]

  {$b('OPTIONS')}
    {$g('--save')}              Save quote to a .txt file
    {$g('--json')}              Save quote as a .json file
    {$g('--html')}              Generate a premium HTML quote card
    {$g('--verbose')}           Show detailed progress output
    {$g('--api-url=URL')}       Override the API endpoint URL
    {$g('--version')}           Show version and exit
    {$g('--help')}              Show this help screen

  {$b('EXAMPLES')}
    {$c('php bin/quote.php')}
    {$c('php bin/quote.php --save --json')}
    {$c('php bin/quote.php --save --json --html --verbose')}
    {$c('php bin/quote.php --api-url=https://zenquotes.io/api/random')}

  {$b('EXIT CODES')}
    {$d('0')}  Success
    {$d('1')}  Soft error (API / storage failure)
    {$d('2')}  Configuration error
    {$d('3')}  Fatal / unexpected error


EOT;
    }

    public function printVersion(): void
    {
        $this->line($this->color('Daily Quote Fetcher v' . self::VERSION, self::FG_CYAN));
        $this->line($this->color('PHP ' . PHP_VERSION . '  |  ' . PHP_OS_FAMILY, self::DIM));
        $this->line('');
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private function line(string $text): void
    {
        echo $text . PHP_EOL;
    }

    private function color(string $text, string $code): string
    {
        if (! $this->tty) {
            return $text;
        }
        return $code . $text . self::RESET;
    }

    private function bold(string $text): string
    {
        return $this->tty ? self::BOLD . $text . self::RESET : $text;
    }

    private function italic(string $text): string
    {
        return $this->tty ? self::ITALIC . $text . self::RESET : $text;
    }

    private function dim(string $text): string
    {
        return $this->tty ? self::DIM . $text . self::RESET : $text;
    }

    private function center(string $text, int $width): string
    {
        $visible = strlen(preg_replace('/\033\[[0-9;]*m/', '', $text) ?? $text);
        $pad     = max(0, (int) floor(($width - $visible) / 2));
        return str_repeat(' ', $pad) . $text;
    }
}
