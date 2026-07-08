<?php

namespace App\InventorySync\Gateway;

interface SupplierApiClientInterface
{
    /**
     * Fetch supplier inventory levels for a list of SKUs.
     *
     * @param array<string> $skus
     * @return array<string, \App\InventorySync\Model\SupplierRecord> Keyed by SKU
     * @throws \App\InventorySync\Gateway\Exception\TransientSupplierException
     */
    public function fetchStock(array $skus): array;
}
