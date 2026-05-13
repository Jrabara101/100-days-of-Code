<?php

declare(strict_types=1);

namespace VaultCLI\UI;

use VaultCLI\DTOs\BudgetDTO;
use VaultCLI\DTOs\TransactionDTO;
use VaultCLI\Enums\TransactionType;

/**
 * TerminalDashboard – ANSI Styling & Layout Engine
 *
 * ════════════════════════════════════════════════════════════════════
 *  Design Philosophy
 * ════════════════════════════════════════════════════════════════════
 * This class is the sole owner of all terminal rendering concerns.
 * It uses ANSI escape sequences for:
 *
 *   • 24-bit (true-color) RGB foreground/background coloring.
 *   • Bold, dim, italic, and reset text attributes.
 *   • Dynamic ASCII progress bars with Unicode block characters.
 *   • Padded, aligned table columns for transaction lists.
 *
 * The rendering layer knows nothing about business logic or storage.
 * It receives pre-computed, already-aggregated data from Commands.
 * This separation follows the MVC pattern at the CLI layer.
 *
 * ════════════════════════════════════════════════════════════════════
 *  ANSI Escape Code Reference
 * ════════════════════════════════════════════════════════════════════
 *  \e[38;2;R;G;Bm  → Set foreground to RGB(R,G,B)
 *  \e[48;2;R;G;Bm  → Set background to RGB(R,G,B)
 *  \e[0m           → Reset all attributes
 *  \e[1m           → Bold
 *  \e[2m           → Dim
 *  \e[3m           → Italic
 */
class TerminalDashboard
{
    // ── ANSI Color Palette (24-bit) ─────────────────────────────────────────────

    // Positive / income: vibrant emerald green
    private const COLOR_GREEN      = [46, 204, 113];
    private const COLOR_GREEN_DIM  = [39, 174, 96];

    // Negative / expense: crimson red
    private const COLOR_RED        = [231, 76, 60];
    private const COLOR_RED_DIM    = [192, 57, 43];

    // Warning: amber / orange
    private const COLOR_AMBER      = [243, 156, 18];

    // Accent: cool indigo / slate
    private const COLOR_INDIGO     = [108, 92, 231];
    private const COLOR_CYAN       = [0, 206, 209];
    private const COLOR_SILVER     = [189, 195, 199];
    private const COLOR_GOLD       = [241, 196, 15];
    private const COLOR_WHITE      = [255, 255, 255];
    private const COLOR_MUTED      = [127, 140, 141];

    // Progress bar characters
    private const BAR_FILLED = '█';
    private const BAR_EMPTY  = '░';
    private const BAR_WIDTH  = 20;

    // Terminal width
    private const TERM_WIDTH = 70;

    // ── ANSI Helpers ────────────────────────────────────────────────────────────

    private function fg(array $rgb, string $text): string
    {
        [$r, $g, $b] = $rgb;
        return "\e[38;2;{$r};{$g};{$b}m{$text}\e[0m";
    }

    private function bg(array $rgb, string $text): string
    {
        [$r, $g, $b] = $rgb;
        return "\e[48;2;{$r};{$g};{$b}m{$text}\e[0m";
    }

    private function bold(string $text): string
    {
        return "\e[1m{$text}\e[0m";
    }

    private function dim(string $text): string
    {
        return "\e[2m{$text}\e[0m";
    }

    private function italic(string $text): string
    {
        return "\e[3m{$text}\e[0m";
    }

    private function colorBold(array $rgb, string $text): string
    {
        [$r, $g, $b] = $rgb;
        return "\e[1;38;2;{$r};{$g};{$b}m{$text}\e[0m";
    }

    private function line(string $char = '═'): string
    {
        return str_repeat($char, self::TERM_WIDTH);
    }

    private function divider(string $char = '─'): string
    {
        return str_repeat($char, self::TERM_WIDTH);
    }

    // ── Public Output Methods ───────────────────────────────────────────────────

    public function success(string $message): void
    {
        echo $this->fg(self::COLOR_GREEN, '  ✔  ') . $this->bold($message) . PHP_EOL;
    }

    public function error(string $message): void
    {
        echo $this->fg(self::COLOR_RED, '  ✖  ') . $this->bold($message) . PHP_EOL;
    }

    public function info(string $message): void
    {
        echo $this->fg(self::COLOR_CYAN, '  ℹ  ') . $message . PHP_EOL;
    }

    // ── Header ──────────────────────────────────────────────────────────────────

    private function renderHeader(): void
    {
        $title   = $this->colorBold(self::COLOR_GOLD, 'VaultCLI') . ' '
                 . $this->fg(self::COLOR_MUTED, 'v' . VAULT_VERSION);
        $engine  = $this->dim('[Engine: PHP ' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . ' | Storage: SQLite3]');

        echo PHP_EOL;
        echo '  ' . $title . '  ' . $engine . PHP_EOL;
        echo $this->fg(self::COLOR_INDIGO, $this->line()) . PHP_EOL;
    }

    // ── Section Labels ──────────────────────────────────────────────────────────

    private function sectionLabel(string $label): void
    {
        $inner = " {$label} ";
        $padded = str_pad("[ {$label} ]", self::TERM_WIDTH, ' ', STR_PAD_BOTH);
        echo $this->colorBold(self::COLOR_CYAN, $padded) . PHP_EOL;
    }

    // ── Financial Overview Panel ─────────────────────────────────────────────────

    private function renderOverview(
        int $incomeCents,
        int $expenseCents,
        int $netCents,
        int $savingsRate,
    ): void {
        $netFormatted      = '$' . number_format($netCents / 100, 2);
        $incomeFormatted   = '$' . number_format($incomeCents / 100, 2);
        $expenseFormatted  = '-$' . number_format($expenseCents / 100, 2);

        $netColor = $netCents >= 0 ? self::COLOR_GREEN : self::COLOR_RED;

        $netLine = sprintf(
            '  %-15s  %s  %s',
            $this->bold('Net Balance  :'),
            $this->colorBold($netColor, str_pad($netFormatted, 12, ' ', STR_PAD_LEFT)),
            $this->fg(self::COLOR_MUTED, "(Saving Rate: {$savingsRate}%)"),
        );

        $incomeLine = sprintf(
            '  %-15s  %s  %s',
            $this->bold('Total Income :'),
            $this->colorBold(self::COLOR_GREEN, str_pad($incomeFormatted, 12, ' ', STR_PAD_LEFT)),
            $this->fg(self::COLOR_GREEN_DIM, '[▲]'),
        );

        $expenseLine = sprintf(
            '  %-15s  %s  %s',
            $this->bold('Total Spend  :'),
            $this->colorBold(self::COLOR_RED, str_pad($expenseFormatted, 12, ' ', STR_PAD_LEFT)),
            $this->fg(self::COLOR_RED_DIM, '[▼]'),
        );

        echo $netLine    . PHP_EOL;
        echo $incomeLine . PHP_EOL;
        echo $expenseLine . PHP_EOL;
    }

    // ── Budget Utilization Panel ─────────────────────────────────────────────────

    /**
     * Renders dynamic progress bars for each budget category.
     *
     * Algorithm:
     *   pct = spentCents / limitCents * 100
     *   filledBlocks = round(pct / 100 * BAR_WIDTH)
     *   Color logic:
     *     pct < 75  → green  (on track)
     *     pct < 100 → amber  (approaching limit)
     *     pct >= 100 → red   (over budget)
     *
     * @param array{category:string, total:int}[] $categoryTotals
     * @param BudgetDTO[] $budgets
     */
    private function renderBudgets(array $categoryTotals, array $budgets): void
    {
        if (empty($budgets)) {
            echo $this->dim('  No budgets configured. Use: vault set-budget --category=X --limit=Y') . PHP_EOL;
            return;
        }

        // Build a lookup: category → spent cents
        $spent = [];
        foreach ($categoryTotals as $row) {
            $spent[$row['category']] = (int) $row['total'];
        }

        echo $this->fg(self::COLOR_MUTED, $this->divider()) . PHP_EOL;

        foreach ($budgets as $budget) {
            $spentCents = $spent[$budget->category] ?? 0;
            $limitCents = $budget->limitCents;

            $pct = $limitCents > 0 ? ($spentCents / $limitCents) * 100 : 0;
            $pctInt = (int) round($pct);

            $filledCount = min(self::BAR_WIDTH, (int) round($pct / 100 * self::BAR_WIDTH));
            $emptyCount  = self::BAR_WIDTH - $filledCount;

            $bar = str_repeat(self::BAR_FILLED, $filledCount)
                 . str_repeat(self::BAR_EMPTY, $emptyCount);

            // Color the bar based on utilization threshold
            $barColor = match(true) {
                $pct < 75  => self::COLOR_GREEN,
                $pct < 100 => self::COLOR_AMBER,
                default    => self::COLOR_RED,
            };

            $overTag = $pct >= 100
                ? ' ' . $this->fg(self::COLOR_RED, $this->bold('[OVER]'))
                : '';

            // Format spent / limit amounts
            $spentFmt = '$' . str_pad(number_format($spentCents / 100, 0), 6, ' ', STR_PAD_LEFT);
            $limitFmt = '$' . str_pad(number_format($limitCents / 100, 0), 6, ' ', STR_PAD_LEFT);

            $pctLabel = $this->fg($barColor, str_pad($pctInt . '%', 4, ' ', STR_PAD_LEFT));

            $line = sprintf(
                '  %-12s | %s / %s | [%s] %s%s',
                $this->bold(str_pad($budget->category, 12)),
                $this->fg($barColor, $spentFmt),
                $limitFmt,
                $this->fg($barColor, $bar),
                $pctLabel,
                $overTag,
            );

            echo $line . PHP_EOL;
        }
    }

    // ── Recent Transactions Table ────────────────────────────────────────────────

    /**
     * Renders a padded ASCII table of the most recent transactions.
     *
     * @param TransactionDTO[] $transactions
     */
    private function renderTransactions(array $transactions): void
    {
        if (empty($transactions)) {
            echo $this->dim('  No transactions found.') . PHP_EOL;
            return;
        }

        $header = sprintf(
            '  %-6s | %-10s | %-12s | %-18s | %s',
            $this->colorBold(self::COLOR_SILVER, 'ID'),
            $this->colorBold(self::COLOR_SILVER, 'Date'),
            $this->colorBold(self::COLOR_SILVER, 'Category'),
            $this->colorBold(self::COLOR_SILVER, 'Description'),
            $this->colorBold(self::COLOR_SILVER, 'Amount'),
        );

        echo $this->fg(self::COLOR_MUTED, $this->divider()) . PHP_EOL;
        echo $header . PHP_EOL;
        echo $this->fg(self::COLOR_MUTED, $this->divider()) . PHP_EOL;

        foreach ($transactions as $tx) {
            $isIncome   = $tx->type === TransactionType::INCOME;
            $sign       = $isIncome ? '+' : '-';
            $amtColor   = $isIncome ? self::COLOR_GREEN : self::COLOR_RED;
            $amtFormatted = $sign . ' $' . number_format($tx->amountCents / 100, 2);

            $idStr    = '#' . str_pad((string) $tx->id, 4, ' ', STR_PAD_LEFT);
            $catStr   = mb_strimwidth($tx->category,   0, 12, '…');
            $descStr  = mb_strimwidth($tx->description, 0, 18, '…');

            $row = sprintf(
                '  %-6s | %-10s | %-12s | %-18s | %s',
                $this->fg(self::COLOR_MUTED, $idStr),
                $tx->date,
                $catStr,
                $descStr,
                $this->colorBold($amtColor, $amtFormatted),
            );

            echo $row . PHP_EOL;
        }
    }

    // ── Footer ──────────────────────────────────────────────────────────────────

    private function renderFooter(): void
    {
        $elapsed = round((microtime(true) - VAULT_START) * 1000, 1);
        $ramMB   = round(memory_get_peak_usage(true) / 1_048_576, 1);

        echo $this->fg(self::COLOR_INDIGO, $this->line()) . PHP_EOL;

        $footer = sprintf(
            "  %s | Peak RAM: %s MB | Query Time: %s ms",
            $this->fg(self::COLOR_MUTED, "Type 'vault --help' for commands"),
            $this->fg(self::COLOR_CYAN, (string) $ramMB),
            $this->fg(self::COLOR_CYAN, (string) $elapsed),
        );
        echo $footer . PHP_EOL . PHP_EOL;
    }

    // ── Full Dashboard Orchestration ─────────────────────────────────────────────

    /**
     * Renders the complete financial dashboard.
     *
     * @param array{category:string, total:int}[] $categoryTotals
     * @param BudgetDTO[]         $budgets
     * @param TransactionDTO[]    $recentTx
     */
    public function renderFullDashboard(
        int   $year,
        int   $month,
        int   $incomeCents,
        int   $expenseCents,
        int   $netCents,
        int   $savingsRate,
        array $categoryTotals,
        array $budgets,
        array $recentTx,
    ): void {
        $monthName = date('F', mktime(0, 0, 0, $month, 1, $year));

        $this->renderHeader();

        $this->sectionLabel("FINANCIAL OVERVIEW: {$monthName} {$year}");
        echo PHP_EOL;
        $this->renderOverview($incomeCents, $expenseCents, $netCents, $savingsRate);
        echo PHP_EOL;

        echo $this->fg(self::COLOR_INDIGO, $this->line()) . PHP_EOL;
        $this->sectionLabel('BUDGET UTILIZATION');
        echo PHP_EOL;
        $this->renderBudgets($categoryTotals, $budgets);
        echo PHP_EOL;

        echo $this->fg(self::COLOR_INDIGO, $this->line()) . PHP_EOL;
        $this->sectionLabel('RECENT TRANSACTIONS');
        echo PHP_EOL;
        $this->renderTransactions($recentTx);
        echo PHP_EOL;

        $this->renderFooter();
    }

    // ── Help Screen ─────────────────────────────────────────────────────────────

    /** @param array<string, CommandInterface> $commands */
    public function renderHelp(array $commands): void
    {
        $this->renderHeader();
        $this->sectionLabel('AVAILABLE COMMANDS');
        echo PHP_EOL;

        foreach ($commands as $name => $cmd) {
            $nameStr = $this->colorBold(self::COLOR_CYAN, str_pad("vault {$name}", 22));
            echo "  {$nameStr}  " . $cmd->description() . PHP_EOL;
        }

        echo PHP_EOL;
        $this->sectionLabel('EXAMPLES');
        echo PHP_EOL;

        $examples = [
            'vault add-expense --amount=85.50 --category="Dining Out" --desc="Sushi Date"',
            'vault add-income  --amount=6500 --desc="Client Retainer"',
            'vault set-budget  --category=Groceries --limit=600',
            'vault report      --report=current-month',
            'vault report      --report=2026-11',
            'vault delete      --id=104',
        ];

        foreach ($examples as $ex) {
            echo '  ' . $this->fg(self::COLOR_MUTED, '›') . ' ' . $this->italic($ex) . PHP_EOL;
        }

        echo PHP_EOL;
        $this->renderFooter();
    }
}
