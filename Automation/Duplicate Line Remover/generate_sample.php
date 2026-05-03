<?php

declare(strict_types=1);

/**
 * generate_sample.php – Creates a sample text file for testing DedupeCLI.
 *
 * Usage:  php generate_sample.php [lines] [duplicate_ratio]
 *   lines           Total lines to write (default: 200,000)
 *   duplicate_ratio Fraction of lines that are duplicates 0.0–1.0 (default: 0.35)
 *
 * Example:
 *   php generate_sample.php 500000 0.4
 */

$totalLines     = (int)   ($argv[1] ?? 200_000);
$duplicateRatio = (float) ($argv[2] ?? 0.35);

$outputFile = __DIR__ . '/sample/sample_data.txt';

@mkdir(dirname($outputFile), 0777, true);

$handle = fopen($outputFile, 'w');
if ($handle === false) {
    fwrite(STDERR, "Cannot create output file: {$outputFile}\n");
    exit(1);
}

echo "Generating {$totalLines} lines ({$duplicateRatio}% duplicates) → {$outputFile}\n";

$uniquePool = [];
$poolSize   = (int) ($totalLines * (1 - $duplicateRatio));

// Pre-generate the unique pool
for ($i = 0; $i < $poolSize; $i++) {
    $uniquePool[] = sprintf(
        '%s,%s,%s,%d,%s',
        'user_' . bin2hex(random_bytes(4)),
        fake_email(),
        fake_ip(),
        random_int(100, 9999),
        date('Y-m-d H:i:s', random_int(strtotime('2023-01-01'), time()))
    );
}

// Write lines: first fill with all unique pool entries, then inject duplicates
$written = 0;
for ($i = 0; $i < $totalLines; $i++) {
    $isDupe = ($i >= $poolSize); // once pool is exhausted, all lines are duplicates
    if ($isDupe) {
        // Randomly repeat a line from the pool
        $line = $uniquePool[array_rand($uniquePool)];
    } else {
        $line = $uniquePool[$i];
        $written++;
    }
    fwrite($handle, $line . "\n");
}

fclose($handle);

$size = number_format(filesize($outputFile));
echo "Done. File size: {$size} bytes\n";
echo "Run: php dedupe.php --input=sample/sample_data.txt\n";

// ── Helper functions ──────────────────────────────────────────────────────────

function fake_email(): string
{
    $domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.io', 'dev.net'];
    return bin2hex(random_bytes(4)) . '@' . $domains[array_rand($domains)];
}

function fake_ip(): string
{
    return random_int(1, 255) . '.' . random_int(0, 255) . '.' . random_int(0, 255) . '.' . random_int(1, 254);
}
