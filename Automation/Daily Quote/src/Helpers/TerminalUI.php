<?php

declare(strict_types=1);

namespace DailyQuote\Helpers;

use Symfony\Component\Console\Output\OutputInterface;

/**
 * TerminalUI — Polished ANSI terminal output helper.
 *
 * Wraps Symfony Console's OutputInterface with premium-looking
 * box-drawing characters, ANSI colour pairs, separators, and
 * layout primitives so every command looks like a professional dashboard.
 *
 * Colour tags used (Symfony Console colour syntax):
 *   <info>     → green
 *   <comment>  → yellow
 *   <error>    → red on dark background
 *   <question> → cyan
 *   <fg=...>   → any supported colour
 */
final class TerminalUI
{
    // ── Box-drawing palette ──────────────────────────────────────────────────
    private const BOX_TL  = '╔';
    private const BOX_TR  = '╗';
    private const BOX_BL  = '╚';
    private const BOX_BR  = '╝';
    private const BOX_H   = '═';
    private const BOX_V   = '║';
    private const BOX_ML  = '╠';
    private const BOX_MR  = '╣';

    private const THIN_H  = '─';
    private const THIN_V  = '│';
    private const THIN_TL = '┌';
    private const THIN_TR = '┐';
    private const THIN_BL = '└';
    private const THIN_BR = '┘';

    // ── Width ────────────────────────────────────────────────────────────────
    private const WIDTH = 70;

    public function __construct(private readonly OutputInterface $output) {}

    // ── Banner ───────────────────────────────────────────────────────────────

    /** Large, coloured application title banner. */
    public function banner(string $version = '2.0.0'): void
    {
        $w = self::WIDTH;

        $this->output->writeln('');
        $this->output->writeln("  <fg=cyan>" . self::BOX_TL . str_repeat(self::BOX_H, $w - 2) . self::BOX_TR . "</>");
        $this->output->writeln("  <fg=cyan>" . self::BOX_V  . "</><fg=bright-cyan;options=bold>"  . $this->center('✦  DAILY QUOTE FETCHER  ✦', $w - 2) . "</><fg=cyan>" . self::BOX_V . "</>");
        $this->output->writeln("  <fg=cyan>" . self::BOX_V  . "</><fg=white>"    . $this->center("v{$version}  ·  Powered by ZenQuotes API", $w - 2)  . "</><fg=cyan>" . self::BOX_V . "</>");
        $this->output->writeln("  <fg=cyan>" . self::BOX_BL . str_repeat(self::BOX_H, $w - 2) . self::BOX_BR . "</>");
        $this->output->writeln('');
    }

    // ── Section header ───────────────────────────────────────────────────────

    /** Coloured section header with thin top/bottom lines. */
    public function sectionHeader(string $title, string $color = 'yellow'): void
    {
        $w = self::WIDTH;
        $this->output->writeln('');
        $this->output->writeln("  <fg={$color}>" . self::THIN_TL . str_repeat(self::THIN_H, $w - 2) . self::THIN_TR . "</>");
        $this->output->writeln("  <fg={$color}>" . self::THIN_V  . "</> <fg={$color};options=bold>" . str_pad("  {$title}", $w - 4) . " </><fg={$color}>" . self::THIN_V . "</>");
        $this->output->writeln("  <fg={$color}>" . self::THIN_BL . str_repeat(self::THIN_H, $w - 2) . self::THIN_BR . "</>");
    }

    // ── Quote card ───────────────────────────────────────────────────────────

    /**
     * Render a beautiful quote card.
     *
     * @param array $quote  Keys: text, author, source, fetched_at
     */
    public function quoteCard(array $quote): void
    {
        $w    = self::WIDTH;
        $pad  = $w - 4;  // inner usable width

        $this->output->writeln('');
        $this->output->writeln("  <fg=magenta>" . self::BOX_TL . str_repeat(self::BOX_H, $w - 2) . self::BOX_TR . "</>");
        $this->output->writeln("  <fg=magenta>" . self::BOX_V  . str_repeat(' ', $w - 2) . self::BOX_V . "</>");

        // Quote text — word-wrapped
        $lines = $this->wordWrap($quote['text'] ?? '', $pad - 4);
        foreach ($lines as $line) {
            $padded = '  ' . str_pad($line, $pad - 2);
            $this->output->writeln("  <fg=magenta>" . self::BOX_V . "</><fg=bright-white;options=bold>  {$padded}</><fg=magenta>" . self::BOX_V . "</>");
        }

        $this->output->writeln("  <fg=magenta>" . self::BOX_V  . str_repeat(' ', $w - 2) . self::BOX_V . "</>");

        // Author
        $authorLine = str_pad("  — {$quote['author']}", $pad);
        $this->output->writeln("  <fg=magenta>" . self::BOX_V . "</><fg=cyan>  {$authorLine}</><fg=magenta>" . self::BOX_V . "</>");

        // Divider
        $this->output->writeln("  <fg=magenta>" . self::BOX_ML . str_repeat(self::BOX_H, $w - 2) . self::BOX_MR . "</>");

        // Metadata row
        $this->metaRow('Source', $quote['source'] ?? 'unknown', $pad);
        $this->metaRow('Fetched', $quote['fetched_at'] ?? 'unknown', $pad);

        $this->output->writeln("  <fg=magenta>" . self::BOX_BL . str_repeat(self::BOX_H, $w - 2) . self::BOX_BR . "</>");
        $this->output->writeln('');
    }

    // ── Status messages ──────────────────────────────────────────────────────

    public function success(string $message): void
    {
        $this->output->writeln("  <fg=green;options=bold>  ✔  {$message}</>");
    }

    public function warning(string $message): void
    {
        $this->output->writeln("  <fg=yellow;options=bold>  ⚠  {$message}</>");
    }

    public function error(string $message): void
    {
        $this->output->writeln("  <fg=red;options=bold>  ✖  {$message}</>");
    }

    public function info(string $message): void
    {
        $this->output->writeln("  <fg=cyan>  ℹ  {$message}</>");
    }

    public function label(string $key, string $value, string $keyColor = 'yellow'): void
    {
        $this->output->writeln(
            "    <fg={$keyColor};options=bold>" . str_pad($key . ':', 14) . "</>" .
            "<fg=white>{$value}</>"
        );
    }

    // ── Separator ────────────────────────────────────────────────────────────

    public function separator(string $color = 'gray'): void
    {
        $this->output->writeln("  <fg={$color}>" . str_repeat(self::THIN_H, self::WIDTH) . "</>");
    }

    public function blank(): void
    {
        $this->output->writeln('');
    }

    // ── Footer ───────────────────────────────────────────────────────────────

    public function footer(bool $success = true): void
    {
        $ts      = date('Y-m-d H:i:s T');
        $status  = $success
            ? "<fg=green;options=bold>  ✔  Operation completed successfully</>"
            : "<fg=red;options=bold>  ✖  Operation failed</>";

        $this->output->writeln('');
        $this->separator('gray');
        $this->output->writeln("  {$status}");
        $this->output->writeln("  <fg=gray>  {$ts}</>");
        $this->separator('gray');
        $this->output->writeln('');
    }

    // ── History table ────────────────────────────────────────────────────────

    /**
     * Render a paginated history table.
     *
     * @param array<int, array> $quotes
     */
    public function historyTable(array $quotes, int $page = 1, int $perPage = 10): void
    {
        $total  = count($quotes);
        $pages  = (int) ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;
        $slice  = array_slice($quotes, $offset, $perPage);

        $this->sectionHeader("📜  QUOTE HISTORY  (page {$page}/{$pages}, {$total} total)", 'yellow');
        $this->blank();

        foreach ($slice as $i => $q) {
            $num    = $offset + $i + 1;
            $date   = substr($q['saved_at'] ?? '', 0, 10);
            $author = str_pad($q['author'] ?? 'Unknown', 20);
            $text   = $this->truncate($q['text'] ?? '', 40);

            $this->output->writeln(
                "  <fg=yellow;options=bold>  #{$num}</> " .
                "<fg=gray>[{$date}]</> " .
                "<fg=cyan>{$author}</> " .
                "<fg=white>{$text}</>"
            );
        }

        $this->blank();
        if ($pages > 1) {
            $this->info("Use --page=N to navigate pages (1–{$pages}).");
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function center(string $text, int $width): string
    {
        $len  = mb_strlen($text);
        $pad  = max(0, (int) floor(($width - $len) / 2));
        return str_repeat(' ', $pad) . $text . str_repeat(' ', $width - $pad - $len);
    }

    private function metaRow(string $label, string $value, int $innerWidth): void
    {
        $w    = self::WIDTH;
        $line = str_pad("  {$label}: {$value}", $innerWidth);
        $this->output->writeln("  <fg=magenta>" . self::BOX_V . "</><fg=gray>{$line}  </><fg=magenta>" . self::BOX_V . "</>");
    }

    /**
     * Word-wrap $text to fit within $maxWidth columns.
     *
     * @return string[]
     */
    private function wordWrap(string $text, int $maxWidth): array
    {
        $wrapped = wordwrap($text, $maxWidth, "\n", cut_long_words: true);
        return explode("\n", $wrapped);
    }

    private function truncate(string $text, int $maxLen): string
    {
        if (mb_strlen($text) <= $maxLen) {
            return $text;
        }
        return mb_substr($text, 0, $maxLen - 3) . '...';
    }
}
