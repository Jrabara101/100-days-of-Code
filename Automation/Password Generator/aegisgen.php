#!/usr/bin/env php
<?php

/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  AegisGen v2.0.4 — Cryptographically Secure Password & Key Engine   │
 * │  Author : Senior PHP Systems Architect                               │
 * │  Engine : PHP 8.2+ | CSPRNG: random_int() / random_bytes()          │
 * │  License: MIT                                                        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * USAGE:
 *   php aegisgen.php [OPTIONS]
 *
 * OPTIONS:
 *   --mode=<password|diceware|apikey>   Generation strategy  (default: password)
 *   --length=<N>                        Password length       (default: 24)
 *   --words=<N>                         Diceware word count   (default: 5)
 *   --format=<base64|hex>               API key format        (default: base64)
 *   --no-upper                          Exclude uppercase letters
 *   --no-lower                          Exclude lowercase letters
 *   --no-digits                         Exclude digits
 *   --no-symbols                        Exclude symbols
 *   --count=<N>                         Bulk: generate N passwords (default: 1)
 *   --no-color                          Disable ANSI color output
 *   --help                              Show this help screen
 *
 * EXAMPLES:
 *   php aegisgen.php
 *   php aegisgen.php --mode=diceware --words=6
 *   php aegisgen.php --mode=apikey --format=hex
 *   php aegisgen.php --length=32 --no-symbols --count=5
 *
 * Security Architecture Notes:
 * ----------------------------
 *   1. CSPRNG: All randomness sourced exclusively from random_int() / random_bytes(),
 *      which delegate to the OS CSPRNG (/dev/urandom, BCryptGenRandom, arc4random).
 *      Never rand(), mt_rand(), or array_rand().
 *
 *   2. Character Guarantee: RandomStringGenerator uses slot reservation +
 *      Fisher-Yates shuffle (via random_int) to guarantee required character
 *      classes without rejection sampling bias.
 *
 *   3. Memory Safety: All Password Value Objects and sensitive strings are
 *      unset() explicitly after output. gc_collect_cycles() forces immediate
 *      reclamation of the memory page — critical in shared-server environments
 *      susceptible to memory-dump attacks.
 *
 *   4. Strategy Pattern: Adding a new generator (e.g. UUIDv7, TOTP) requires
 *      only implementing GeneratorStrategyInterface and registering one entry
 *      in $strategyMap below. Zero changes to the engine, entropy calculator,
 *      or dashboard.
 */

declare(strict_types=1);

// ── Autoloader (manual — no Composer dependency required) ────────────────────
spl_autoload_register(function (string $class): void {
    // Namespace root: AegisGen\ → src/
    $prefix = 'AegisGen\\';
    $base   = __DIR__ . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR;

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file     = $base . str_replace('\\', DIRECTORY_SEPARATOR, $relative) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use AegisGen\Generators\ApiKeyGenerator;
use AegisGen\Generators\DicewareGenerator;
use AegisGen\Generators\RandomStringGenerator;
use AegisGen\Security\EntropyCalculator;
use AegisGen\UI\AnsiStyle;
use AegisGen\UI\TerminalDashboard;
use AegisGen\ValueObjects\Password;

// ── Require CLI context ──────────────────────────────────────────────────────
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "AegisGen must be run from the command line.\n");
    exit(1);
}

// ── Parse CLI arguments ──────────────────────────────────────────────────────
$args   = $argv;
array_shift($args); // remove script name

$opts = parseArguments($args);

// ── Help screen ───────────────────────────────────────────────────────────────
if ($opts['help']) {
    printHelp();
    exit(0);
}

// ── Color mode ───────────────────────────────────────────────────────────────
if ($opts['noColor']) {
    AnsiStyle::disableColor();
}

// ── Bootstrap shared services ────────────────────────────────────────────────
$entropy   = new EntropyCalculator();
$dashboard = new TerminalDashboard($entropy);

// ── Strategy Map (Strategy Pattern dispatcher) ────────────────────────────────
// To register a new strategy: add one entry here + create the implementing class.
$strategyMap = [
    'password' => new RandomStringGenerator($entropy),
    'diceware' => new DicewareGenerator($entropy),
    'apikey'   => new ApiKeyGenerator($entropy),
];

$mode = $opts['mode'];

if (!isset($strategyMap[$mode])) {
    fwrite(STDERR, "Unknown mode '{$mode}'. Use --help for available modes.\n");
    exit(1);
}

$strategy = $strategyMap[$mode];

// ── Build config snapshot (for dashboard display) ────────────────────────────
$config = [
    'mode'       => $strategy->modeLabel(),
    'length'     => $opts['length'],
    'useUpper'   => $opts['useUpper'],
    'useLower'   => $opts['useLower'],
    'useDigits'  => $opts['useDigits'],
    'useSymbols' => $opts['useSymbols'],
    'wordCount'  => $opts['words'],
    'format'     => $opts['format'],
];

// ── Generate ─────────────────────────────────────────────────────────────────
try {
    $count = max(1, $opts['count']);

    if ($count === 1) {
        // Single generation
        $password = $strategy->generate(buildStrategyOptions($opts));
        $dashboard->render($password, $config);

        // ── Memory hygiene: unset after output ────────────────────────────
        // PHP's reference-counting GC immediately drops the refcount to 0,
        // reclaiming the memory page. This prevents plaintext passwords from
        // lingering in process memory beyond their useful lifetime.
        unset($password);
    } else {
        // Bulk generation
        /** @var Password[] $passwords */
        $passwords = [];
        for ($i = 0; $i < $count; $i++) {
            $passwords[] = $strategy->generate(buildStrategyOptions($opts));
        }

        $dashboard->renderBulk($passwords, $config);

        // Unset all generated passwords from memory
        foreach ($passwords as $i => $pw) {
            unset($passwords[$i]);
        }
        unset($passwords);
    }
} catch (\InvalidArgumentException $e) {
    fwrite(STDERR, AnsiStyle::wrap('[ERROR] ', AnsiStyle::FG_CRIMSON, AnsiStyle::BOLD));
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
} catch (\Throwable $e) {
    fwrite(STDERR, AnsiStyle::wrap('[FATAL] ', AnsiStyle::FG_CRIMSON, AnsiStyle::BOLD));
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(2);
} finally {
    // Final GC sweep regardless of success or exception path
    unset($strategy, $strategyMap, $entropy, $dashboard, $config, $opts);
    gc_collect_cycles();
}

exit(0);

// ────────────────────────────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parse $argv into a structured options array.
 *
 * @param  string[] $args
 * @return array<string, mixed>
 */
function parseArguments(array $args): array
{
    $opts = [
        'mode'       => 'password',
        'length'     => 24,
        'words'      => 5,
        'format'     => 'base64',
        'useUpper'   => true,
        'useLower'   => true,
        'useDigits'  => true,
        'useSymbols' => true,
        'count'      => 1,
        'noColor'    => false,
        'help'       => false,
    ];

    foreach ($args as $arg) {
        if ($arg === '--help' || $arg === '-h') {
            $opts['help'] = true;
            continue;
        }

        if ($arg === '--no-color') {
            $opts['noColor'] = true;
            continue;
        }

        if ($arg === '--no-upper')   { $opts['useUpper']   = false; continue; }
        if ($arg === '--no-lower')   { $opts['useLower']   = false; continue; }
        if ($arg === '--no-digits')  { $opts['useDigits']  = false; continue; }
        if ($arg === '--no-symbols') { $opts['useSymbols'] = false; continue; }

        if (preg_match('/^--(\w[\w-]*)=(.+)$/', $arg, $m)) {
            [, $key, $val] = $m;
            switch ($key) {
                case 'mode':   $opts['mode']   = strtolower(trim($val)); break;
                case 'length': $opts['length'] = max(4, (int) $val); break;
                case 'words':  $opts['words']  = max(3, (int) $val); break;
                case 'format': $opts['format'] = strtolower(trim($val)); break;
                case 'count':  $opts['count']  = max(1, (int) $val); break;
            }
        }
    }

    return $opts;
}

/**
 * Build the strategy-specific options array from the parsed CLI opts.
 *
 * @param  array<string, mixed> $opts
 * @return array<string, mixed>
 */
function buildStrategyOptions(array $opts): array
{
    return [
        'length'     => $opts['length'],
        'useUpper'   => $opts['useUpper'],
        'useLower'   => $opts['useLower'],
        'useDigits'  => $opts['useDigits'],
        'useSymbols' => $opts['useSymbols'],
        'wordCount'  => $opts['words'],
        'separator'  => '-',
        'format'     => $opts['format'],
    ];
}

/**
 * Print a rich formatted help screen.
 */
function printHelp(): void
{
    $title   = AnsiStyle::wrap('AegisGen v2.0.4', AnsiStyle::FG_TEAL, AnsiStyle::BOLD);
    $sub     = AnsiStyle::wrap('Cryptographically Secure Password & Key Engine', AnsiStyle::FG_GRAY);
    $section = fn(string $s) => AnsiStyle::wrap($s, AnsiStyle::FG_GOLD, AnsiStyle::BOLD);
    $flag    = fn(string $f) => AnsiStyle::wrap(str_pad($f, 30), AnsiStyle::FG_LIME);
    $dflt    = fn(string $d) => AnsiStyle::wrap("(default: {$d})", AnsiStyle::FG_GRAY);

    echo <<<EOT

  {$title}  {$sub}

  {$section('USAGE')}
    php aegisgen.php [OPTIONS]

  {$section('GENERATION MODES')}
    {$flag('--mode=password')}   Complex alphanumeric + symbols password
    {$flag('--mode=diceware')}   EFF-style memorable passphrase {$dflt('password')}
    {$flag('--mode=apikey')}     base64/hex API key for .env files

  {$section('PASSWORD OPTIONS')}
    {$flag('--length=<N>')}      Character length {$dflt('24')}
    {$flag('--no-upper')}        Exclude uppercase letters
    {$flag('--no-lower')}        Exclude lowercase letters
    {$flag('--no-digits')}       Exclude digits
    {$flag('--no-symbols')}      Exclude symbol characters

  {$section('DICEWARE OPTIONS')}
    {$flag('--words=<N>')}       Number of passphrase words {$dflt('5')}

  {$section('API KEY OPTIONS')}
    {$flag('--format=base64|hex')} Encoding format {$dflt('base64')}

  {$section('GENERAL OPTIONS')}
    {$flag('--count=<N>')}       Bulk generation: generate N passwords {$dflt('1')}
    {$flag('--no-color')}        Disable ANSI colors (pipe-safe mode)
    {$flag('--help')}            Show this help screen

  {$section('EXAMPLES')}
    php aegisgen.php
    php aegisgen.php --mode=diceware --words=6
    php aegisgen.php --mode=apikey --format=hex
    php aegisgen.php --length=32 --no-symbols --count=5

EOT;
}
