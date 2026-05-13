<?php

declare(strict_types=1);

namespace InvioCLI\Domain\Calculators;

use InvioCLI\Domain\Models\LineItem;

class FinancialEngine
{
    /**
     * @param LineItem[] $items
     */
    public function calculateSubtotal(array $items): int
    {
        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += $item->getTotalCents();
        }
        return $subtotal;
    }

    public function calculateDiscount(int $subtotalCents, int $discountPercent): int
    {
        return (int) round($subtotalCents * ($discountPercent / 100), 0, PHP_ROUND_HALF_UP);
    }

    public function calculateTax(int $taxBaseCents, int $taxPercent): int
    {
        return (int) round($taxBaseCents * ($taxPercent / 100), 0, PHP_ROUND_HALF_UP);
    }
}
