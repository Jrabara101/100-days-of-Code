<?php

namespace App\Jobs;

use App\Models\SubOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DispatchVendorNewOrderNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public SubOrder $subOrder)
    {
    }

    public function handle(): void
    {
        Log::info("Dispatched Studio Order Notification for Sub-Order {$this->subOrder->sub_order_number} to Vendor {$this->subOrder->vendor_id}");
    }
}
