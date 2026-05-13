<?php

declare(strict_types=1);

require_once __DIR__ . '/src/Config/ExportFormat.php';
require_once __DIR__ . '/src/Config/CouponProfile.php';
require_once __DIR__ . '/src/Validation/ChecksumEngine.php';
require_once __DIR__ . '/src/Generators/SecureStringGenerator.php';
require_once __DIR__ . '/src/UI/AnsiStyle.php';
require_once __DIR__ . '/src/UI/CliProgressRenderer.php';
require_once __DIR__ . '/src/Exporters/ExporterInterface.php';
require_once __DIR__ . '/src/Exporters/CsvStreamWriter.php';

use PromoForge\Config\CouponProfile;
use PromoForge\Config\ExportFormat;
use PromoForge\Generators\SecureStringGenerator;
use PromoForge\Exporters\CsvStreamWriter;
use PromoForge\UI\CliProgressRenderer;

// --- CONFIGURATION ---
$profile = new CouponProfile(
    formatTemplate: 'BLACKFRIDAY-####-####-[C]',
    batchSize: 500000,
    exportFormat: ExportFormat::CSV,
    exportPath: __DIR__ . '/exports/blackfriday_2026.csv',
    useChecksum: true,
    campaignName: 'BLACKFRIDAY'
);

$renderer = new CliProgressRenderer();
$renderer->renderHeader(
    $profile->campaignName,
    $profile->formatTemplate . "  (* [C] = Checksum)",
    $profile->batchSize,
    $profile->exportPath
);

// --- GENERATOR LOGIC ---
$generator = new SecureStringGenerator();

// Infinite generator yielding secure codes
$codeGenerator = function() use ($generator, $profile) {
    while (true) {
        yield $generator->generateCode($profile);
    }
};

$exporter = new CsvStreamWriter($profile->exportPath, $renderer);

// --- EXECUTION ---
$startTime = microtime(true);

$exporter->export($codeGenerator(), $profile->batchSize);

$endTime = microtime(true);
$executionTime = $endTime - $startTime;

// Compute peak RAM usage
$peakMemoryBytes = memory_get_peak_usage(true);
$peakMemory = round($peakMemoryBytes / 1024 / 1024, 2) . ' MB';

// Calculate file size
$fileSizeBytes = filesize($profile->exportPath);
$fileSize = round($fileSizeBytes / 1024 / 1024, 2) . ' MB';

// Fetch sample output (first 3 codes from file to verify)
$samples = [];
if (($handle = fopen($profile->exportPath, 'r')) !== false) {
    fgetcsv($handle); // Skip header
    for ($i = 0; $i < 3; $i++) {
        $row = fgetcsv($handle);
        if ($row !== false && isset($row[0])) {
            $samples[] = $row[0];
        }
    }
    fclose($handle);
}

// --- RENDER SUMMARY ---
$renderer->renderSummary(
    $samples,
    $profile->batchSize,
    $fileSize,
    $executionTime,
    $peakMemory
);
