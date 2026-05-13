<?php

declare(strict_types=1);

namespace MatrixCLI\Renderers;

use MatrixCLI\Matrix\QRMatrix;

final class AnsiConsoleRenderer implements RendererInterface
{
    // By default, terminals have light text on dark background.
    // To represent a LIGHT QR pixel, we draw the text block.
    // To represent a DARK QR pixel, we leave it empty (background shows).
    // This perfectly matches the prompt's requested inverted output.
    private const BLOCK_BOTH_LIGHT = '█';
    private const BLOCK_TOP_LIGHT_BOTTOM_DARK = '▀';
    private const BLOCK_TOP_DARK_BOTTOM_LIGHT = '▄';
    private const BLOCK_BOTH_DARK = ' ';

    public function __construct(
        private bool $invertColors = true
    ) {}

    public function render(QRMatrix $matrix, ?string $outputPath = null): string
    {
        $size = $matrix->size;
        $quietZone = 2; // Terminal margin

        $output = "";

        // Process two rows at a time
        for ($y = -$quietZone; $y < $size + $quietZone; $y += 2) {
            $line = "";
            
            for ($x = -$quietZone; $x < $size + $quietZone; $x++) {
                $isTopDark = $this->isDark($matrix, $x, $y);
                $isBottomDark = $this->isDark($matrix, $x, $y + 1);

                if (!$isTopDark && !$isBottomDark) {
                    $line .= self::BLOCK_BOTH_LIGHT;
                } elseif (!$isTopDark && $isBottomDark) {
                    $line .= self::BLOCK_TOP_LIGHT_BOTTOM_DARK;
                } elseif ($isTopDark && !$isBottomDark) {
                    $line .= self::BLOCK_TOP_DARK_BOTTOM_LIGHT;
                } else {
                    $line .= self::BLOCK_BOTH_DARK;
                }
            }
            
            $output .= "    " . $line . "\n";
        }

        return rtrim($output);
    }

    private function isDark(QRMatrix $matrix, int $x, int $y): bool
    {
        if ($x < 0 || $y < 0 || $x >= $matrix->size || $y >= $matrix->size) {
            return false; // Margins are light
        }

        return $matrix->isDark($x, $y);
    }
}
