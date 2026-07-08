<?php

namespace App\InventorySync\Model;

class SupplierRecord
{
    public function __construct(
        public readonly string $sku,
        public readonly int    $availableQty,
        public readonly float  $unitCost,
        public readonly string $asOf
    ) {}
}
