<?php

namespace App\InventorySync\Model;

class SyncResult
{
    public function __construct(
        public readonly LocalProduct  $product,
        public readonly int           $previousQty,
        public readonly int           $newQty,
        public readonly float         $supplierCost,
        public readonly SyncOutcome   $outcome,
        public readonly string        $note
    ) {}
}
