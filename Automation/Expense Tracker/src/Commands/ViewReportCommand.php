<?php

declare(strict_types=1);

namespace VaultCLI\Commands;

use VaultCLI\Repositories\TransactionRepositoryInterface;
use VaultCLI\Repositories\BudgetRepositoryInterface;
use VaultCLI\UI\TerminalDashboard;

/**
 * ViewReportCommand – handles `vault report`
 *
 * Usage:
 *   vault report [--report=current-month | --report=YTD | --report=YYYY-MM]
 *
 * Generates a full financial dashboard:
 *  • Net balance, income, expenses, savings rate
 *  • Budget utilization per category with progress bars
 *  • Recent transactions table
 */
final class ViewReportCommand implements CommandInterface
{
    public function __construct(
        private readonly TransactionRepositoryInterface $txRepo,
        private readonly BudgetRepositoryInterface      $budgetRepo,
        private readonly TerminalDashboard              $ui,
    ) {}

    public function description(): string
    {
        return 'Display the financial dashboard. Use --report=current-month | --report=YTD | --report=YYYY-MM';
    }

    public function execute(array $args): void
    {
        $opts   = $this->parseArgs($args);
        $report = $opts['report'] ?? 'current-month';

        [$year, $month] = $this->resolveReportPeriod($report);

        // ── Fetch data ──────────────────────────────────────────────────────────
        $incomeCents  = $this->txRepo->totalIncomeCents($year, $month);
        $expenseCents = $this->txRepo->totalExpenseCents($year, $month);
        $netCents     = $incomeCents - $expenseCents;
        $savingsRate  = $incomeCents > 0
            ? (int) round(($netCents / $incomeCents) * 100)
            : 0;

        $categoryTotals = $this->txRepo->sumByCategory($year, $month);
        $budgets        = $this->budgetRepo->findAll();
        $recentTx       = $this->txRepo->findAll(10, 0);

        // ── Render ──────────────────────────────────────────────────────────────
        $this->ui->renderFullDashboard(
            year:           $year,
            month:          $month,
            incomeCents:    $incomeCents,
            expenseCents:   $expenseCents,
            netCents:       $netCents,
            savingsRate:    $savingsRate,
            categoryTotals: $categoryTotals,
            budgets:        $budgets,
            recentTx:       $recentTx,
        );
    }

    private function resolveReportPeriod(string $report): array
    {
        return match(true) {
            $report === 'current-month'                   => [(int) date('Y'), (int) date('m')],
            $report === 'YTD'                             => [(int) date('Y'), (int) date('m')],
            (bool) preg_match('/^(\d{4})-(\d{2})$/', $report, $m) => [(int) $m[1], (int) $m[2]],
            default                                       => [(int) date('Y'), (int) date('m')],
        };
    }

    private function parseArgs(array $args): array
    {
        $opts = [];
        foreach ($args as $arg) {
            if (preg_match('/^--(\w[\w-]*)=(.+)$/', $arg, $m)) {
                $opts[$m[1]] = $m[2];
            }
        }
        return $opts;
    }
}
