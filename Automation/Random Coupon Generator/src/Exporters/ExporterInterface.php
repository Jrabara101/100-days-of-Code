<?php

declare(strict_types=1);

namespace PromoForge\Exporters;

use Generator;

interface ExporterInterface
{
    /**
     * Export the generated codes from a Generator to a destination.
     * 
     * @param Generator $codeGenerator The generator yielding coupon codes.
     * @param int $totalCount The total number of codes expected (for progress tracking/UI).
     */
    public function export(Generator $codeGenerator, int $totalCount): void;
}
