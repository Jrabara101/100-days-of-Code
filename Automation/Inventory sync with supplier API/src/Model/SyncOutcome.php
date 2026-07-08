<?php

namespace App\InventorySync\Model;

enum SyncOutcome: string
{
    case Unchanged     = 'unchanged';
    case Restocked     = 'restocked';
    case Reduced       = 'reduced';
    case BelowReorder  = 'below_reorder';
    case PriceDrift    = 'price_drift';
    case Conflict      = 'conflict';
}
