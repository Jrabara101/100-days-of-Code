<?php

declare(strict_types=1);

namespace MatrixCLI\Matrix;

use MatrixCLI\Enums\EccLevel;
use MatrixCLI\Payload\PayloadInterface;

interface MatrixGeneratorInterface
{
    /**
     * Generates a QRMatrix DTO from a given payload and ECC level.
     */
    public function generate(PayloadInterface $payload, EccLevel $eccLevel): QRMatrix;
}
