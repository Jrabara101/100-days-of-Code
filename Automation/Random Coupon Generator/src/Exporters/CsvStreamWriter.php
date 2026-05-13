<?php

declare(strict_types=1);

namespace PromoForge\Exporters;

use Generator;
use SplFileObject;
use PromoForge\UI\CliProgressRenderer;

class CsvStreamWriter implements ExporterInterface
{
    private string $destinationPath;
    private CliProgressRenderer $renderer;
    
    public int $collisionsPrevented = 0;

    public function __construct(string $destinationPath, CliProgressRenderer $renderer)
    {
        $this->destinationPath = $destinationPath;
        $this->renderer = $renderer;
    }

    public function export(Generator $codeGenerator, int $totalCount): void
    {
        // Ensure directory exists
        $dir = dirname($this->destinationPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $file = new SplFileObject($this->destinationPath, 'w');
        $file->fputcsv(['Coupon_Code']); // Header

        $generatedCount = 0;
        $hashMap = []; // O(1) Lookup array for collisions

        $startTime = microtime(true);

        foreach ($codeGenerator as $code) {
            // Check for collision using a hash key for O(1) lookup
            $codeHash = md5($code); // hashing reduces memory footprint per string slightly if string is long, though for small strings raw code is fine.
            if (isset($hashMap[$codeHash])) {
                $this->collisionsPrevented++;
                continue; // Skip this one, the generator loop logic in main handles ensuring totalCount is reached.
            }

            $hashMap[$codeHash] = true;
            $file->fputcsv([$code]);
            
            $generatedCount++;

            // Update UI every 500 codes to avoid I/O bottleneck
            if ($generatedCount % 500 === 0 || $generatedCount === $totalCount) {
                $this->renderer->renderProgress(
                    $generatedCount,
                    $totalCount,
                    $startTime,
                    $this->collisionsPrevented
                );
            }

            if ($generatedCount === $totalCount) {
                break;
            }
        }
    }
}
