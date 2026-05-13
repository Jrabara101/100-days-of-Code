<?php

declare(strict_types=1);

namespace ChronoVault\Bootstrap;

use ChronoVault\Commands\CommandInterface;
use ChronoVault\Commands\ListCommand;
use ChronoVault\Commands\ReadCommand;
use ChronoVault\Commands\StatsCommand;
use ChronoVault\Commands\WriteCommand;
use ChronoVault\Crypto\CipherEngine;
use ChronoVault\Crypto\KeyDerivation;
use ChronoVault\Domain\Mood;
use ChronoVault\Storage\EncryptedJournalRepository;
use ChronoVault\Storage\SqliteJournalRepository;
use ChronoVault\System\EditorProcess;
use ChronoVault\Terminal\TerminalUI;
use RuntimeException;

/**
 * Application — The DI Container, Boot Sequence, and Command Router.
 *
 * ARCHITECTURAL REASONING:
 * ─────────────────────────────────────────────────────────────────────
 * This class acts as the Composition Root — the single place in the
 * application where all concrete implementations are wired together.
 *
 * PHP doesn't require a full DI framework for a CLI tool of this size.
 * Manual wiring in a "pure DI" style (no reflection magic, no containers)
 * is faster, debuggable, and explicit. Every dependency is visible here.
 *
 * BOOT SEQUENCE:
 *   1. Show the app header
 *   2. Detect if vault is new (no salt file = first run)
 *   3. Prompt for master passphrase (masked input)
 *   4. Derive the Argon2id key from the passphrase
 *   5. Wire up: SqliteRepo → EncryptedRepo (with CipherEngine)
 *   6. Route the CLI argument to the correct Command
 *   7. Execute and exit with the command's return code
 */
class Application
{
    private readonly TerminalUI $ui;
    private readonly string     $vaultDir;
    private readonly string     $dbPath;

    public function __construct(string $vaultDir)
    {
        $this->vaultDir = rtrim($vaultDir, DIRECTORY_SEPARATOR);
        $this->dbPath   = $this->vaultDir . DIRECTORY_SEPARATOR . 'vault.db';
        $this->ui       = new TerminalUI();

        // Ensure the vault directory exists.
        if (!is_dir($this->vaultDir) && !mkdir($this->vaultDir, 0700, true)) {
            throw new RuntimeException("Cannot create vault directory: {$this->vaultDir}");
        }
    }

    /**
     * Boots the application and runs the requested command.
     *
     * @param  array  $argv  The raw PHP $argv array.
     * @return int           Exit code to pass to exit().
     */
    public function run(array $argv): int
    {
        $commandName = $argv[1] ?? 'dashboard';
        $args        = array_slice($argv, 2);

        // ── Step 1: Render header ────────────────────────────────────────────
        if ($commandName === 'dashboard' || $commandName === '') {
            $this->ui->renderAppHeader();
        }

        // ── Step 2: Key derivation (vault unlock) ────────────────────────────
        $keyDerivation = new KeyDerivation($this->vaultDir);
        $isNewVault    = !$keyDerivation->isInitialized();

        if ($isNewVault) {
            echo PHP_EOL;
            $this->ui->info('🆕 First run! Initializing a new ChronoVault.');
            $this->ui->info('   Choose a strong master passphrase. You cannot recover entries without it.');
            echo PHP_EOL;
        }

        $passphrase = $this->ui->promptPassphrase(isNewVault: $isNewVault);

        if (trim($passphrase) === '') {
            $this->ui->error('Passphrase cannot be empty.');
            return 1;
        }

        // ── Step 3: Derive key & build crypto stack ──────────────────────────
        echo PHP_EOL;
        $this->ui->info('Unlocking vault...');

        try {
            $key    = $keyDerivation->deriveKey($passphrase);
            $cipher = new CipherEngine($key);
        } catch (RuntimeException $e) {
            $this->ui->error("Vault unlock failed: {$e->getMessage()}");
            return 1;
        }

        // ── Step 4: Wire storage layer ───────────────────────────────────────
        $sqliteRepo    = new SqliteJournalRepository($this->dbPath);
        $encryptedRepo = new EncryptedJournalRepository($sqliteRepo, $cipher);

        // ── Step 5: Build command registry ───────────────────────────────────
        $editor   = new EditorProcess();
        $commands = $this->buildCommands($encryptedRepo, $editor);

        // ── Step 6: Route to command ─────────────────────────────────────────
        if ($commandName === 'dashboard' || $commandName === '') {
            return $this->runDashboard($encryptedRepo);
        }

        if ($commandName === 'help') {
            $this->renderHelp($commands);
            return 0;
        }

        if (!isset($commands[$commandName])) {
            $this->ui->error("Unknown command: '{$commandName}'. Run 'cvault help' for usage.");
            return 1;
        }

        return $commands[$commandName]->execute($args);
    }

    /**
     * Renders the full dashboard view (default when no command is given).
     */
    private function runDashboard(EncryptedJournalRepository $repo): int
    {
        $recentEntries = $repo->findRecent(5);
        $allEntries    = $repo->findAll();
        $totalWords    = $repo->totalWordCount();

        // Build 7-day mood map.
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date       = date('Y-m-d', strtotime("-{$i} days"));
            $dayLabel   = date('D', strtotime("-{$i} days")); // Mon, Tue...
            $last7Days[$dayLabel] = null;

            foreach ($allEntries as $entry) {
                if ($entry->date === $date) {
                    $last7Days[$dayLabel] = $entry->mood;
                    break;
                }
            }
        }

        // Current streak.
        $dates = array_unique(array_map(fn($e) => $e->date, $allEntries));
        sort($dates);
        $streak = $this->calculateCurrentStreak($dates);

        // Current mood = most recent entry's mood.
        $currentMood = !empty($recentEntries) ? $recentEntries[0]->mood : null;

        $this->ui->renderVaultStatus($streak, $totalWords, $currentMood);
        $this->ui->renderMoodTrend7Days($last7Days);
        $this->ui->renderEntryTable($recentEntries);
        $this->ui->renderFooterHint();

        return 0;
    }

    /**
     * Builds and returns the command registry.
     *
     * @return CommandInterface[]  Keyed by command name.
     */
    private function buildCommands(
        EncryptedJournalRepository $repo,
        EditorProcess $editor,
    ): array {
        $commands = [
            new WriteCommand($repo, $editor, $this->ui),
            new ReadCommand($repo, $this->ui),
            new ListCommand($repo, $this->ui),
            new StatsCommand($repo, $this->ui),
        ];

        $registry = [];
        foreach ($commands as $command) {
            $registry[$command->getName()] = $command;
        }

        return $registry;
    }

    /**
     * Renders the help screen.
     *
     * @param CommandInterface[] $commands
     */
    private function renderHelp(array $commands): void
    {
        $this->ui->renderAppHeader();
        echo PHP_EOL;
        echo "\e[38;2;180;140;255m\e[1m  USAGE:\e[0m  php cvault [command] [options]" . PHP_EOL;
        echo PHP_EOL;
        echo "\e[38;2;120;120;150m  ─────────────────────────────────────────────────────────────────────\e[0m" . PHP_EOL;
        echo "\e[38;2;120;120;150m  Command          Description\e[0m" . PHP_EOL;
        echo "\e[38;2;120;120;150m  ─────────────────────────────────────────────────────────────────────\e[0m" . PHP_EOL;

        $builtIn = ['(no command)' => 'Show the dashboard with streaks, mood trend, and recent entries'];
        foreach ($builtIn as $name => $desc) {
            printf("\e[38;2;147;112;219m  %-16s\e[0m  \e[38;2;200;200;220m%s\e[0m\n", $name, $desc);
        }

        foreach ($commands as $command) {
            printf("\e[38;2;147;112;219m  %-16s\e[0m  \e[38;2;200;200;220m%s\e[0m\n",
                $command->getName(),
                $command->getDescription()
            );
        }
        printf("\e[38;2;147;112;219m  %-16s\e[0m  \e[38;2;200;200;220m%s\e[0m\n",
            'help', 'Show this help screen'
        );

        echo PHP_EOL;
    }

    /**
     * Streak helper — also used in StatsCommand. Kept here for dashboard use.
     *
     * @param string[] $sortedDates
     */
    private function calculateCurrentStreak(array $sortedDates): int
    {
        if (empty($sortedDates)) {
            return 0;
        }

        $today     = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $lastDate  = end($sortedDates);

        if ($lastDate !== $today && $lastDate !== $yesterday) {
            return 0;
        }

        $streak  = 1;
        $current = $lastDate;

        for ($i = count($sortedDates) - 2; $i >= 0; $i--) {
            $expected = date('Y-m-d', strtotime($current . ' -1 day'));
            if ($sortedDates[$i] === $expected) {
                $streak++;
                $current = $sortedDates[$i];
            } else {
                break;
            }
        }

        return $streak;
    }
}
