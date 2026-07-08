<?php

namespace App\InventorySync\Repository;

interface ProductRepositoryInterface
{
    /**
     * Get all products in our catalog.
     *
     * @return array<\App\InventorySync\Model\LocalProduct>
     */
    public function getAll(): array;

    /**
     * Get last known unit costs.
     *
     * @return array<string, float> SKU -> unit cost
     */
    public function getKnownCosts(): array;

    /**
     * Update a local product's stock levels.
     */
    public function updateProduct(string $sku, int $qty, string $syncTime): void;
}
