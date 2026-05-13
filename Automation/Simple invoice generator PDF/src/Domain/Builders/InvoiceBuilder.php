<?php

declare(strict_types=1);

namespace InvioCLI\Domain\Builders;

use InvioCLI\Domain\Models\Invoice;
use InvioCLI\Domain\Models\Customer;
use InvioCLI\Domain\Models\LineItem;
use InvioCLI\Domain\Enums\Currency;
use InvioCLI\Domain\Enums\TaxType;
use InvioCLI\Domain\Calculators\FinancialEngine;
use RuntimeException;

class InvoiceBuilder
{
    private ?string $invoiceNumber = null;
    private ?string $date = null;
    private ?Customer $customer = null;
    private array $items = [];
    private int $discountPercent = 0;
    private TaxType $taxType = TaxType::NONE;
    private int $taxPercent = 0;
    private Currency $currency = Currency::USD;

    public function __construct(private FinancialEngine $engine)
    {
    }

    public function setInvoiceNumber(string $number): self
    {
        $this->invoiceNumber = $number;
        return $this;
    }

    public function setDate(string $date): self
    {
        $this->date = $date;
        return $this;
    }

    public function setCustomer(Customer $customer): self
    {
        $this->customer = $customer;
        return $this;
    }

    public function addItem(LineItem $item): self
    {
        $this->items[] = $item;
        return $this;
    }

    public function setDiscountPercent(int $percent): self
    {
        if ($percent < 0 || $percent > 100) {
            throw new RuntimeException("Discount percent must be between 0 and 100.");
        }
        $this->discountPercent = $percent;
        return $this;
    }

    public function setTax(TaxType $type, int $percent): self
    {
        if ($percent < 0 || $percent > 100) {
            throw new RuntimeException("Tax percent must be between 0 and 100.");
        }
        $this->taxType = $type;
        $this->taxPercent = $percent;
        return $this;
    }

    public function setCurrency(Currency $currency): self
    {
        $this->currency = $currency;
        return $this;
    }

    public function build(): Invoice
    {
        if (!$this->invoiceNumber || !$this->date || !$this->customer || empty($this->items)) {
            throw new RuntimeException("Missing required invoice fields (number, date, customer, or items).");
        }

        $subtotalCents = $this->engine->calculateSubtotal($this->items);
        $discountCents = $this->engine->calculateDiscount($subtotalCents, $this->discountPercent);
        $taxBaseCents = $subtotalCents - $discountCents;
        $taxCents = $this->engine->calculateTax($taxBaseCents, $this->taxPercent);
        $grandTotalCents = $taxBaseCents + $taxCents;

        return new Invoice(
            $this->invoiceNumber,
            $this->date,
            $this->customer,
            $this->items,
            $subtotalCents,
            $this->discountPercent,
            $discountCents,
            $taxBaseCents,
            $this->taxType,
            $this->taxPercent,
            $taxCents,
            $grandTotalCents,
            $this->currency
        );
    }
}
