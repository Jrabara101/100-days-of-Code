<?php

declare(strict_types=1);

namespace MatrixCLI\Renderers;

use MatrixCLI\Matrix\QRMatrix;
use RuntimeException;

final class SvgRenderer implements RendererInterface
{
    public function render(QRMatrix $matrix, ?string $outputPath = null): string
    {
        $size = $matrix->size;
        $quietZone = 4;
        $totalSize = $size + ($quietZone * 2);
        
        $svg = sprintf(
            '<?xml version="1.0" encoding="UTF-8"?>'."\n".
            '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="%d" height="%d" viewBox="0 0 %d %d">'."\n",
            $totalSize * 10, $totalSize * 10, $totalSize, $totalSize
        );
        
        $svg .= sprintf('<rect x="0" y="0" width="%d" height="%d" fill="#ffffff" />'."\n", $totalSize, $totalSize);
        $svg .= '<path fill="#000000" d="';

        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                if ($matrix->isDark($x, $y)) {
                    $svg .= sprintf('M%d %d h1 v1 h-1 v-1 ', $x + $quietZone, $y + $quietZone);
                }
            }
        }

        $svg .= '" />'."\n".'</svg>';

        if ($outputPath !== null) {
            if (file_put_contents($outputPath, $svg) === false) {
                throw new RuntimeException("Failed to write SVG to $outputPath");
            }
        }

        return $svg;
    }
}
