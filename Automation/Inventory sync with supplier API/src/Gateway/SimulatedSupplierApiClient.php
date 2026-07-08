<?php

namespace App\InventorySync\Gateway;

use App\InventorySync\Gateway\Exception\TransientSupplierException;
use App\InventorySync\Model\SupplierRecord;

class SimulatedSupplierApiClient implements SupplierApiClientInterface
{
    private int $callCount = 0;

    /**
     * @param array<string> $skus
     * @return array<string, SupplierRecord>
     */
    public function fetchStock(array $skus): array
    {
        $this->callCount++;

        // Simulates transient 503 error on first call (40% probability)
        if ($this->callCount === 1 && random_int(1, 100) <= 40) {
            throw new TransientSupplierException('Supplier API returned 503 Service Unavailable (simulated)');
        }

        $records = [];
        foreach ($skus as $sku) {
            $seed     = crc32($sku);
            $baseQty  = abs($seed % 200);
            $unitCost = round(5.0 + (abs($seed) % 9500) / 100, 2);
            
            // Simulates stale feed (3 days old) for specific SKUs
            $isStale  = ($seed % 7 === 0);
            $asOf     = $isStale
                ? date('Y-m-d\TH:i:s\Z', strtotime('-3 days'))
                : date('Y-m-d\TH:i:s\Z');

            $records[$sku] = new SupplierRecord($sku, $baseQty, $unitCost, $asOf);
        }
        return $records;
    }
}
