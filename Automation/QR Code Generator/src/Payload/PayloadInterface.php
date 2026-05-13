<?php

declare(strict_types=1);

namespace MatrixCLI\Payload;

use MatrixCLI\Enums\PayloadType;

interface PayloadInterface
{
    /**
     * Get the formatted string that will be encoded into the QR matrix.
     */
    public function getFormattedData(): string;

    /**
     * Get the payload type.
     */
    public function getType(): PayloadType;
}
