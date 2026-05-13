#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * seed.php – Populates the VaultCLI database with demo data
 * matching the specification's example dashboard.
 *
 * Run: php seed.php
 */

define('VAULT_ROOT',    __DIR__);
define('VAULT_VERSION', '2.1.0');
define('VAULT_START',   microtime(true));

require_once VAULT_ROOT . '/src/bootstrap.php';

use VaultCLI\DTOs\TransactionDTO;
use VaultCLI\DTOs\BudgetDTO;
use VaultCLI\Enums\TransactionType;
use VaultCLI\Repositories\SQLiteTransactionRepository;
use VaultCLI\Repositories\SQLiteBudgetRepository;

$txRepo     = new SQLiteTransactionRepository(VAULT_DB_PATH);
$budgetRepo = new SQLiteBudgetRepository(VAULT_DB_PATH);

echo "\n  Seeding VaultCLI demo data...\n\n";

// ── Budgets ────────────────────────────────────────────────────────────────────
$budgets = [
    ['Housing',   150000],  // $1,500.00
    ['Groceries',  60000],  // $  600.00
    ['Dining Out', 20000],  // $  200.00
    ['Software',   10000],  // $  100.00
];

foreach ($budgets as [$cat, $limitCents]) {
    $budgetRepo->save(new BudgetDTO(category: $cat, limitCents: $limitCents));
    echo "  Budget set → {$cat}: $" . number_format($limitCents / 100, 2) . "\n";
}

// ── Transactions ───────────────────────────────────────────────────────────────
$transactions = [
    [TransactionType::EXPENSE, 'Housing',   'Monthly Rent',    150000, '2026-11-01'],
    [TransactionType::INCOME,  'Income',    'Client Retainer',  80000, '2026-11-14'],
    [TransactionType::EXPENSE, 'Groceries', 'Whole Foods',      12430, '2026-11-12'],
    [TransactionType::EXPENSE, 'Dining Out','Sushi Date',        8550, '2026-11-15'],
    [TransactionType::INCOME,  'Income',    'Monthly Salary',  570000, '2026-11-01'],
    [TransactionType::EXPENSE, 'Groceries', 'Trader Joes',      32570, '2026-11-08'],
    [TransactionType::EXPENSE, 'Software',  'VS Code License',   5000, '2026-11-03'],
    [TransactionType::EXPENSE, 'Dining Out','Team Lunch',       16450, '2026-11-10'],
];

foreach ($transactions as [$type, $cat, $desc, $amountCents, $date]) {
    $id = $txRepo->save(new TransactionDTO(
        amountCents: $amountCents,
        category:    $cat,
        description: $desc,
        type:        $type,
        date:        $date,
    ));
    $sign = $type === TransactionType::INCOME ? '+' : '-';
    echo "  Tx #{$id} → {$sign}\$" . number_format($amountCents / 100, 2) . " [{$cat}] {$desc}\n";
}

echo "\n  ✔ Seed complete! Run: php vault report\n\n";
