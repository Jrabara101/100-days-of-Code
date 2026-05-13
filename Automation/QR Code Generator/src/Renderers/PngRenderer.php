<?php

declare(strict_types=1);

namespace MatrixCLI\Renderers;

use MatrixCLI\Matrix\QRMatrix;
use RuntimeException;

final class PngRenderer implements RendererInterface
{
    public function __construct(
        private int $scale = 10,
        private int $quietZone = 4
    ) {}

    public function render(QRMatrix $matrix, ?string $outputPath = null): void
    {
        if ($outputPath === null) {
            throw new RuntimeException('OutputPath is required for PNG rendering.');
        }

        if (!extension_loaded('gd')) {
            throw new RuntimeException('GD extension is required for PNG rendering.');
        }

        $size = $matrix->size;
        $totalSize = $size + ($this->quietZone * 2);
        $pixelSize = $totalSize * $this->scale;

        $image = imagecreate($pixelSize, $pixelSize);
        if ($image === false) {
            throw new RuntimeException('Failed to create image resource.');
        }

        // First allocated color is background
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);

        // Fill background
        imagefilledrectangle($image, 0, 0, $pixelSize, $pixelSize, $white);

        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                if ($matrix->isDark($x, $y)) {
                    $px = ($x + $this->quietZone) * $this->scale;
                    $py = ($y + $this->quietZone) * $this->scale;
                    imagefilledrectangle(
                        $image, 
                        $px, 
                        $py, 
                        $px + $this->scale - 1, 
                        $py + $this->scale - 1, 
                        $black
                    );
                }
            }
        }

        if (!imagepng($image, $outputPath)) {
            imagedestroy($image);
            throw new RuntimeException("Failed to write PNG to $outputPath");
        }

        // Strict deterministic destruction for batch memory management
        imagedestroy($image);
        unset($image);
    }
}
