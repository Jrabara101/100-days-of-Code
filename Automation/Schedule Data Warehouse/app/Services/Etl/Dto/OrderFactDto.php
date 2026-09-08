<?php

declare(strict_types=1);

namespace App\Services\Etl\Dto;

use Carbon\CarbonImmutable;

readonly class OrderFactDto
{
    public function __construct(
        public int $orderId,
        public int $customerKey,
        public string $orderStatus,
        public int $itemCount,
        public int $subtotalCents,
        public int $taxCents,
        public int $discountCents,
        public int $totalNetCents,
        public string $orderDateKey,
        public CarbonImmutable $orderedAtUtc
    ) {}

    public function toWarehouseArray(): array
    {
        return [
            'order_id' => $this->orderId,
            'customer_key' => $this->customerKey,
            'order_status' => $this->orderStatus,
            'item_count' => $this->itemCount,
            'subtotal_cents' => $this->subtotalCents,
            'tax_cents' => $this->taxCents,
            'discount_cents' => $this->discountCents,
            'total_net_cents' => $this->totalNetCents,
            'order_date_key' => $this->orderDateKey,
            'ordered_at_utc' => $this->orderedAtUtc->toDateTimeString(),
            'etl_ingested_at' => now()->toDateTimeString(),
            'created_at' => now()->toDateTimeString(),
            'updated_at' => now()->toDateTimeString(),
        ];
    }
}
