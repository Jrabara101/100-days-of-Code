<?php

declare(strict_types=1);

namespace AegisGen\UI;

use AegisGen\Security\EntropyCalculator;
use AegisGen\ValueObjects\Password;

/**
 * TerminalDashboard — Rich CLI Output Renderer
 *
 * Architectural Reasoning:
 * -----------------------
 * The dashboard is a PURE RENDERER — it knows nothing about how passwords
 * are generated. It receives a Password Value Object and a config snapshot,
 * and produces formatted output. This separation means the same dashboard
 * can render results from any GeneratorStrategy without modification.
 *
 * Output is composed of distinct "panels" (header, config, output, analysis,
 * footer) written to stdout via fwrite(STDOUT, ...) rather than echo, which
 * bypasses output buffering and ensures immediate display in piped contexts.
 *
 * Clipboard Integration:
 * ----------------------
 * Platform detection routes to the OS-native clipboard utility:
 *   Windows → clip.exe      (built-in since XP)
 *   macOS   → pbcopy        (built-in)
 *   Linux   → xclip or xsel (common X11 tools, graceful fallback if absent)
 *
 * proc_open() is used (not shell_exec) to get a writable stdin pipe for the
 * clipboard process, allowing us to write the secret directly without
 * exposing it in the process argument list (which would be visible in `ps`).
 */
class TerminalDashboard
{
    private const WIDTH       = 70;
    private const APP_NAME    = 'AegisGen';
    private const APP_VERSION = 'v2.0.4';

    public function __construct(private readonly EntropyCalculator $entropy) {}

    /**
     * Render the full dashboard for a single generated password.
     *
     * @param  Password            $pw
     * @param  array<string,mixed> $config   Raw CLI config snapshot for the config panel
     * @param  int                 $index    1-based index for bulk generation (0 = single)
     */
    public function render(Password $pw, array $config, int $index = 0): void
    {
        $tier  = $this->entropy->strengthTier($pw->entropyBits);
        $color = AnsiStyle::entropyColor($tier);

        $lines = [];

        // ── Header ────────────────────────────────────────────────────────
        if ($index <= 1) {
            $lines[] = '';
            $lines[] = $this->renderHeader();
        }

        // Bulk: numbered sub-header
        if ($index > 0) {
            $lines[] = '';
            $lines[] = AnsiStyle::wrap(
                str_repeat('─', self::WIDTH),
                AnsiStyle::FG_STEEL, AnsiStyle::DIM
            );
            $indexLabel = AnsiStyle::wrap(
                "  Password #{$index}",
                AnsiStyle::FG_GOLD, AnsiStyle::BOLD
            );
            $lines[] = $indexLabel;
        }

        $lines[] = AnsiStyle::sectionLine(self::WIDTH);

        // ── Config Panel ──────────────────────────────────────────────────
        $lines[] = AnsiStyle::sectionLabel('CONFIGURATION');
        $lines[] = $this->renderConfig($config);
        $lines[] = AnsiStyle::sectionLine(self::WIDTH);

        // ── Generated Output Panel ────────────────────────────────────────
        $lines[] = AnsiStyle::sectionLabel('GENERATED OUTPUT');
        $lines[] = '';
        $lines[] = $this->renderOutputBox($pw->value, $color);
        $lines[] = '';
        $lines[] = AnsiStyle::dividerLine(self::WIDTH);

        // ── Security Analysis Panel ───────────────────────────────────────
        $lines[] = AnsiStyle::sectionLabel('SECURITY ANALYSIS');
        $lines[] = $this->renderAnalysis($pw, $tier, $color);
        $lines[] = AnsiStyle::sectionLine(self::WIDTH);

        // ── Footer ────────────────────────────────────────────────────────
        $lines[] = $this->renderFooter($pw);
        $lines[] = '';

        fwrite(STDOUT, implode("\n", $lines) . "\n");

        // Clipboard — after output so the secret isn't left in a variable longer than needed
        $this->copyToClipboard($pw->value);
    }

    /**
     * Render multiple passwords (bulk mode).
     *
     * @param  Password[]          $passwords
     * @param  array<string,mixed> $config
     */
    public function renderBulk(array $passwords, array $config): void
    {
        $this->renderBulkHeader($config, count($passwords));
        foreach ($passwords as $i => $pw) {
            $this->render($pw, $config, $i + 1);
        }
        $this->renderBulkSummary($passwords);
    }

    // ────────────────────────────────────────────────────────────────────
    // Private rendering helpers
    // ────────────────────────────────────────────────────────────────────

    private function renderHeader(): string
    {
        $phpVersion = PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;
        $name   = AnsiStyle::wrap(self::APP_NAME, AnsiStyle::FG_TEAL, AnsiStyle::BOLD);
        $ver    = AnsiStyle::wrap(self::APP_VERSION, AnsiStyle::FG_STEEL);
        $engine = AnsiStyle::wrap(
            "[Engine: PHP {$phpVersion} | CSPRNG: " . AnsiStyle::wrap('Active', AnsiStyle::FG_LIME, AnsiStyle::BOLD) . AnsiStyle::FG_GRAY . "]",
            AnsiStyle::FG_GRAY
        );

        return "  {$name} {$ver}  {$engine}";
    }

    private function renderConfig(array $config): string
    {
        $length = $config['length'] ?? 24;
        $mode   = $config['mode']   ?? 'Alphanumeric + Symbols';

        $useUpper   = (bool) ($config['useUpper']   ?? true);
        $useLower   = (bool) ($config['useLower']   ?? true);
        $useDigits  = (bool) ($config['useDigits']  ?? true);
        $useSymbols = (bool) ($config['useSymbols'] ?? true);

        $col1Width = 34;

        $row1 = '  '
            . AnsiStyle::padRight(AnsiStyle::kv('Length', "{$length} chars"), $col1Width)
            . '| ' . AnsiStyle::kv('Mode', $mode);

        $row2 = '  '
            . AnsiStyle::padRight(
                AnsiStyle::kv('Upper', 'Required') . ' ' . AnsiStyle::badge($useUpper),
                $col1Width
            )
            . '| ' . AnsiStyle::kv('Lower', 'Required') . ' ' . AnsiStyle::badge($useLower);

        $row3 = '  '
            . AnsiStyle::padRight(
                AnsiStyle::kv('Num', 'Required') . ' ' . AnsiStyle::badge($useDigits),
                $col1Width
            )
            . '| ' . AnsiStyle::kv('Symb', 'Required') . ' ' . AnsiStyle::badge($useSymbols);

        return implode("\n", [$row1, $row2, $row3]);
    }

    private function renderOutputBox(string $value, string $color): string
    {
        $secret  = AnsiStyle::wrap($value, $color, AnsiStyle::BOLD);
        $bracket = AnsiStyle::wrap('>', AnsiStyle::FG_STEEL, AnsiStyle::BOLD);
        $lbr     = AnsiStyle::wrap('<', AnsiStyle::FG_STEEL, AnsiStyle::BOLD);
        return "  {$bracket}  {$secret}  {$lbr}";
    }

    private function renderAnalysis(Password $pw, int $tier, string $color): string
    {
        $bar      = $this->entropy->strengthBar($pw->entropyBits);
        $colorBar = AnsiStyle::colorBar($bar, $tier);
        $label    = AnsiStyle::wrap(
            $this->entropy->strengthLabel($pw->entropyBits),
            $color, AnsiStyle::BOLD
        );
        $crackTime = $this->entropy->crackingTime($pw->entropyBits);
        $poolDesc  = $this->describePool($pw);

        $lines = [
            '  ' . AnsiStyle::kv('Entropy Pool', "{$pw->poolSize} characters ({$poolDesc})", 14),
            '  ' . AnsiStyle::kv('Entropy Bits', sprintf('%.1f bits', $pw->entropyBits), 14),
            '  ' . AnsiStyle::kv('Strength    ', "[{$colorBar}] {$label}", 14),
            '  ' . AnsiStyle::kv('Cracking Time', "{$crackTime} (Offline MD5, GPU Farm)", 14),
        ];

        return implode("\n", $lines);
    }

    private function renderFooter(Password $pw): string
    {
        $time = AnsiStyle::wrap(
            sprintf('⏱ Generated in %.3fs', $pw->generationTimeMs / 1000),
            AnsiStyle::FG_GRAY
        );
        $ram  = AnsiStyle::wrap(
            sprintf('| Peak RAM: %.1f MB', memory_get_peak_usage(true) / 1_048_576),
            AnsiStyle::FG_GRAY
        );
        return "  {$time} {$ram}";
    }

    private function renderBulkHeader(array $config, int $count): void
    {
        $c    = AnsiStyle::wrap((string) $count, AnsiStyle::FG_GOLD, AnsiStyle::BOLD);
        $mode = AnsiStyle::wrap($config['mode'] ?? 'Password', AnsiStyle::FG_TEAL);
        $line = "\n  " . AnsiStyle::wrap('[BULK MODE]', AnsiStyle::FG_VIOLET, AnsiStyle::BOLD)
            . "  Generating {$c} × {$mode} passwords\n";
        fwrite(STDOUT, $line);
    }

    private function renderBulkSummary(array $passwords): void
    {
        $avgBits = array_sum(array_map(fn($p) => $p->entropyBits, $passwords)) / count($passwords);
        $summary = "\n  " . AnsiStyle::wrap('[ BULK SUMMARY ]', AnsiStyle::FG_STEEL)
            . '  '
            . AnsiStyle::wrap(count($passwords) . ' passwords', AnsiStyle::FG_WHITE, AnsiStyle::BOLD)
            . AnsiStyle::wrap(' | Avg entropy: ', AnsiStyle::FG_GRAY)
            . AnsiStyle::wrap(sprintf('%.1f bits', $avgBits), AnsiStyle::FG_LIME, AnsiStyle::BOLD)
            . "\n";
        fwrite(STDOUT, $summary);
    }

    /** Human-readable pool description based on mode */
    private function describePool(Password $pw): string
    {
        return match (true) {
            str_contains($pw->mode, 'Diceware')   => 'Curated English wordlist',
            str_contains($pw->mode, 'API Key')     => 'base64/hex alphabet',
            str_contains($pw->mode, 'Symbols')     => 'A-Z, a-z, 0-9, Symbols',
            str_contains($pw->mode, 'Numeric')     => 'A-Z, a-z, 0-9',
            default                                => 'Mixed character pool',
        };
    }

    // ────────────────────────────────────────────────────────────────────
    // Clipboard Integration
    // ────────────────────────────────────────────────────────────────────

    /**
     * Copy the secret to the OS clipboard via a native utility.
     *
     * We use proc_open() with a writable stdin pipe so the secret is passed
     * as stdin data, NOT as a command-line argument (which would appear in
     * `ps aux` / Task Manager process lists — a security exposure).
     */
    private function copyToClipboard(string $value): void
    {
        $cmd = match (PHP_OS_FAMILY) {
            'Windows' => 'clip',
            'Darwin'  => 'pbcopy',
            default   => $this->linuxClipboardCmd(),
        };

        if ($cmd === null) {
            fwrite(STDOUT, AnsiStyle::wrap(
                "  [INFO] Clipboard tool not found (install xclip or xsel).\n",
                AnsiStyle::FG_YELLOW
            ));
            return;
        }

        $desc = [0 => ['pipe', 'r']];  // stdin pipe only
        $proc = @proc_open($cmd, $desc, $pipes);

        if (!is_resource($proc)) {
            fwrite(STDOUT, AnsiStyle::wrap(
                "  [WARN] Could not open clipboard process.\n",
                AnsiStyle::FG_YELLOW
            ));
            return;
        }

        fwrite($pipes[0], $value);
        fclose($pipes[0]);
        proc_close($proc);

        fwrite(STDOUT, AnsiStyle::wrap(
            "  [INFO] Output copied to system clipboard.\n",
            AnsiStyle::FG_GRAY
        ));
    }

    /** Detect available Linux clipboard utility */
    private function linuxClipboardCmd(): ?string
    {
        foreach (['xclip -selection clipboard', 'xsel --clipboard --input'] as $cmd) {
            $tool = explode(' ', $cmd)[0];
            if (shell_exec("which {$tool} 2>/dev/null")) {
                return $cmd;
            }
        }
        return null;
    }
}
