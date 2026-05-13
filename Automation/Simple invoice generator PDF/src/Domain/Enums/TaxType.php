<?php

declare(strict_types=1);

namespace InvioCLI\Domain\Enums;

enum TaxType: string
{
    case VAT = 'VAT';
    case GST = 'GST';
    case NONE = 'NONE';
}
