<?php

namespace App\PaymentSync\Repository;

use App\PaymentSync\Model\Order;

interface OrderRepositoryInterface
{
    /**
     * Retrieve all orders that need their payment status synchronized.
     * Usually active orders (PENDING, AUTHORIZED) or recently updated ones.
     * For demo purposes, we will return a mixed list of active and completed orders to demonstrate conflict detection.
     *
     * @return array<Order>
     */
    public function getPendingOrActiveOrders(): array;

    /**
     * Update the status of a local order.
     *
     * @param string $orderId
     * @param string $newStatus
     * @return void
     */
    public function updateStatus(string $orderId, string $newStatus): void;
}
