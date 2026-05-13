<?php

declare(strict_types=1);

// ─── Manual PSR-4 autoloader (no composer needed) ─────────────────────────────
// Maps VaultCLI\ namespace → src/ directory.
spl_autoload_register(function (string $class): void {
    $prefix = 'VaultCLI\\';
    $baseDir = VAULT_ROOT . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// ─── Ensure data directory exists ─────────────────────────────────────────────
$dataDir = VAULT_ROOT . '/data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

define('VAULT_DB_PATH', $dataDir . '/vault.sqlite');
