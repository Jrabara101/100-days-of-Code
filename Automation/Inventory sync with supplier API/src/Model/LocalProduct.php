<?php

namespace App\InventorySync\Model;

class LocalProduct
{
    public function __construct(
        public readonly string $sku,
        public readonly string $name,
        public int             $quantityOnHand,
        public int             $reorderPoint,
        public ?string         $lastSyncedAt = null
    ) {}

    public function updateQuantity(int $quantity): void
    {
        $this->quantityOnHand = $quantity;
    }

    public function updateLastSyncedAt(string $timestamp): void
    {
        $this->lastSyncedAt = $timestamp;
    }
}
