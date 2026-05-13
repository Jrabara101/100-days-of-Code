<?php

declare(strict_types=1);

namespace InvioCLI\Infrastructure\Renderers;

use InvioCLI\Domain\Models\Invoice;

interface PdfRendererInterface
{
    public function render(Invoice $invoice, string $outputPath): void;
}
