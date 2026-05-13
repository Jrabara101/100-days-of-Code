<?php

declare(strict_types=1);

namespace InvioCLI\Domain\Models;

use InvioCLI\Domain\Enums\Currency;
use InvioCLI\Domain\Enums\TaxType;

readonly class Invoice
{
    /**
     * @param LineItem[] $items
     */
    public function __construct(
        public string $invoiceNumber,
        public string $date,
        public Customer $customer,
        public array $items,
        public int $subtotalCents,
        public int $discountPercent,
        public int $discountCents,
        public int $taxBaseCents,
        public TaxType $taxType,
        public int $taxPercent,
        public int $taxCents,
        public int $grandTotalCents,
        public Currency $currency
    ) {
    }
}
