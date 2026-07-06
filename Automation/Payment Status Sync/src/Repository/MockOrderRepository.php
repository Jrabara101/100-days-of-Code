<?php

namespace App\PaymentSync\Repository;

use App\PaymentSync\Model\Order;
use App\PaymentSync\Model\PaymentStatus;
use DateTimeImmutable;

class MockOrderRepository implements OrderRepositoryInterface
{
    /**
     * In-memory database of mock orders.
     *
     * @var array<string, Order>
     */
    private array $orders = [];

    public function __construct()
    {
        $now = new DateTimeImmutable();

        $this->orders = [
            'TX-1001' => new Order('TX-1001', 99.99,  'USD', PaymentStatus::PENDING,    $now->modify('-2 hours')),
            'TX-1002' => new Order('TX-1002', 15.50,  'EUR', PaymentStatus::PENDING,    $now->modify('-3 hours')),
            'TX-1003' => new Order('TX-1003', 450.00, 'USD', PaymentStatus::PENDING,    $now->modify('-1 day')),
            'TX-1004' => new Order('TX-1004', 12.00,  'GBP', PaymentStatus::PENDING,    $now->modify('-5 days')),
            'TX-1005' => new Order('TX-1005', 89.00,  'USD', PaymentStatus::AUTHORIZED, $now->modify('-1 hour')),
            'TX-1006' => new Order('TX-1006', 25.00,  'USD', PaymentStatus::PAID,       $now->modify('-1 hour')),
            'TX-1007' => new Order('TX-1007', 120.00, 'USD', PaymentStatus::PAID,       $now->modify('-30 minutes')),
            'TX-1008' => new Order('TX-1008', 10.00,  'USD', PaymentStatus::PAID,       $now->modify('-10 minutes')),
            'TX-1009' => new Order('TX-1009', 34.99,  'USD', PaymentStatus::PENDING,    $now->modify('-4 hours')),
            'TX-1010' => new Order('TX-1010', 150.00, 'USD', PaymentStatus::PENDING,    $now->modify('-5 hours')),
            'TX-1011' => new Order('TX-1011', 5.00,   'USD', PaymentStatus::PENDING,    $now->modify('-6 hours')),
        ];
    }

    public function getPendingOrActiveOrders(): array
    {
        return array_values($this->orders);
    }

    public function updateStatus(string $orderId, string $newStatus): void
    {
        if (isset($this->orders[$orderId])) {
            $this->orders[$orderId]->transitionTo($newStatus);
        }
    }
}
