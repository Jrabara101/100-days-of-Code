<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use MatrixCLI\Enums\EccLevel;
use MatrixCLI\Enums\PayloadType;
use MatrixCLI\Matrix\ChillerlanMatrixGenerator;
use MatrixCLI\Payload\PayloadFactory;
use MatrixCLI\Renderers\AnsiConsoleRenderer;
use MatrixCLI\Renderers\SvgRenderer;
use MatrixCLI\Renderers\PngRenderer;
use MatrixCLI\UI\TerminalUI;

$startTime = microtime(true);

// Parse CLI Arguments
$options = getopt('', ['batch:', 'format:', 'ecc:', 'invert-colors']);

$batchFile = $options['batch'] ?? null;
$format = $options['format'] ?? 'svg';
$eccRaw = $options['ecc'] ?? 'H';
$invertColors = isset($options['invert-colors']); // Default to false if not provided, wait, I set default to true in renderer. Let's pass it.

$eccLevel = match (strtoupper($eccRaw)) {
    'L' => EccLevel::L,
    'M' => EccLevel::M,
    'Q' => EccLevel::Q,
    default => EccLevel::H,
};

$matrixGenerator = new ChillerlanMatrixGenerator();
$ui = new TerminalUI();
$ansiRenderer = new AnsiConsoleRenderer($invertColors); // Use standard colors unless inverted is requested (actually inverting might be needed for scannability depending on terminal)
// Wait, my invertColors in AnsiConsoleRenderer defaults to true, which is standard terminal inversion (white bg). I will pass true by default.
$ansiRenderer = new AnsiConsoleRenderer(!isset($options['no-invert'])); 

$svgRenderer = new SvgRenderer();
$pngRenderer = new PngRenderer();

// --- BATCH MODE ---
if ($batchFile) {
    if (!file_exists($batchFile)) {
        die("Batch file not found: $batchFile\n");
    }

    echo "Running batch generation from $batchFile...\n";
    
    $handle = fopen($batchFile, 'r');
    if ($handle !== false) {
        $headers = fgetcsv($handle);
        $count = 0;
        
        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($headers, $row);
            
            // Assume CSV has a 'type' column
            $typeStr = strtolower($data['type'] ?? 'url');
            $type = match ($typeStr) {
                'wifi' => PayloadType::WIFI,
                'vcard' => PayloadType::VCARD,
                default => PayloadType::URL,
            };
            
            $payload = PayloadFactory::create($type, $data);
            $matrix = $matrixGenerator->generate($payload, $eccLevel);
            
            $filename = "output_{$count}.{$format}";
            
            if ($format === 'png') {
                $pngRenderer->render($matrix, $filename);
            } else {
                $svgRenderer->render($matrix, $filename);
            }
            
            $count++;
            // Memory is cleared natively in PngRenderer.
        }
        fclose($handle);
        
        $time = microtime(true) - $startTime;
        echo "Batch generation completed. Generated $count QR codes in " . number_format($time, 3) . "s.\n";
    }
    exit(0);
}

// --- SINGLE MODE (Demo) ---
// Default to the requested youtube.com demo
$payloadData = [
    'url' => 'https://youtube.com',
];
$payload = PayloadFactory::create(PayloadType::URL, $payloadData);

$matrix = $matrixGenerator->generate($payload, $eccLevel);

$exportPath = __DIR__ . '/youtube_demo.' . $format;
if ($format === 'png') {
    $pngRenderer->render($matrix, $exportPath);
} else {
    $svgRenderer->render($matrix, $exportPath);
}

$ansiOutput = $ansiRenderer->render($matrix);

$generationTime = microtime(true) - $startTime;
$peakRam = memory_get_peak_usage(true);

$ui->renderDashboard(
    $payload,
    $eccLevel,
    $matrix,
    $ansiOutput,
    $exportPath,
    $generationTime,
    $peakRam
);
