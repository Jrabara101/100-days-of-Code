<?php

declare(strict_types=1);

namespace MatrixCLI\Renderers;

use MatrixCLI\Matrix\QRMatrix;

interface RendererInterface
{
    /**
     * Renders the given QRMatrix into a specific output format.
     * @return string|void The output string (e.g. SVG/ANSI) or void if saving to file (PNG).
     */
    public function render(QRMatrix $matrix, ?string $outputPath = null);
}
