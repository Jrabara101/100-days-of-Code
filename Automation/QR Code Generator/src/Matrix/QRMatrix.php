<?php

declare(strict_types=1);

namespace MatrixCLI\Matrix;

final readonly class QRMatrix
{
    /**
     * @param int $size The width/height of the matrix
     * @param array<int, array<int, bool>> $grid The boolean 2D array representing the QR code (true = dark, false = light)
     */
    public function __construct(
        public int $size,
        public array $grid
    ) {}

    /**
     * Helper to safely check if a coordinate is dark.
     */
    public function isDark(int $x, int $y): bool
    {
        return $this->grid[$y][$x] ?? false;
    }
}
