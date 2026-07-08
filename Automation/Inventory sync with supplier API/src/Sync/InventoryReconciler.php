<?php

namespace App\InventorySync\Sync;

use App\InventorySync\Model\LocalProduct;
use App\InventorySync\Model\SupplierRecord;
use App\InventorySync\Model\SyncOutcome;
use App\InventorySync\Model\SyncResult;
use App\InventorySync\Repository\ProductRepositoryInterface;

class InventoryReconciler
{
    private const PRICE_DRIFT_THRESHOLD = 0.10; // 10% drift limit

    public function __construct(
        private readonly ProductRepositoryInterface $repository
    ) {}

    public function reconcile(LocalProduct $product, SupplierRecord $supplier): SyncResult
    {
        $previousQty = $product->quantityOnHand;
        $notes       = [];

        // 1. Conflict Guard (stale-feed conflict detection)
        if ($product->lastSyncedAt !== null) {
            $lastSync    = strtotime($product->lastSyncedAt);
            $supplierAsOf = strtotime($supplier->asOf);
            if ($supplierAsOf !== false && $lastSync !== false && $supplierAsOf < $lastSync) {
                return new SyncResult(
                    $product,
                    $previousQty,
                    $previousQty,
                    $supplier->unitCost,
                    SyncOutcome::Conflict,
                    "Supplier feed ({$supplier->asOf}) is older than last sync ({$product->lastSyncedAt})"
                );
            }
        }

        // Apply quantity update
        $product->updateQuantity($supplier->availableQty);
        $delta = $supplier->availableQty - $previousQty;

        // 2. Price drift detection
        $knownCosts = $this->repository->getKnownCosts();
        $prevCost   = $knownCosts[$product->sku] ?? null;
        $priceDrift = false;
        if ($prevCost !== null && $prevCost > 0.0) {
            $driftPct = abs($supplier->unitCost - $prevCost) / $prevCost;
            if ($driftPct >= self::PRICE_DRIFT_THRESHOLD) {
                $priceDrift = true;
                $sign       = $supplier->unitCost > $prevCost ? '+' : '-';
                $notes[]    = sprintf('Price drift %s%.1f%%', $sign, $driftPct * 100);
            }
        }

        // 3. Selection of primary outcome
        if ($delta === 0 && !$priceDrift) {
            $outcome = SyncOutcome::Unchanged;
            $notes[] = 'No change';
        } elseif ($supplier->availableQty < $product->reorderPoint) {
            // BelowReorder takes precedence because a partial restock that still leaves stock
            // below the reorder point is the most operationally urgent case.
            $outcome = SyncOutcome::BelowReorder;
            $qtyDir  = $delta > 0 ? "+{$delta}" : (string)$delta;
            $notes[] = "Qty {$supplier->availableQty} < reorder point {$product->reorderPoint}; Qty {$qtyDir}";
        } elseif ($delta > 0) {
            $outcome = SyncOutcome::Restocked;
            $notes[] = "Qty +{$delta}";
        } elseif ($delta < 0) {
            $outcome = SyncOutcome::Reduced;
            $notes[] = "Qty {$delta}";
        } else {
            $outcome = SyncOutcome::PriceDrift;
        }

        // Update database repository state
        $this->repository->updateProduct($product->sku, $supplier->availableQty, date('Y-m-d\TH:i:s\Z'));

        return new SyncResult(
            $product,
            $previousQty,
            $supplier->availableQty,
            $supplier->unitCost,
            $outcome,
            implode('; ', $notes)
        );
    }
}
