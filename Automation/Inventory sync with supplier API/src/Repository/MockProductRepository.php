<?php

namespace App\InventorySync\Repository;

use App\InventorySync\Model\LocalProduct;

class MockProductRepository implements ProductRepositoryInterface
{
    /** @var array<LocalProduct> */
    private array $products;

    /** @var array<string, float> */
    private array $knownCosts;

    public function __construct()
    {
        $this->products = [
            new LocalProduct('SKU-A001', 'Wireless Keyboard',   82,  50,  '2026-07-06T08:00:00Z'),
            new LocalProduct('SKU-A002', 'USB-C Hub (7-port)',  14,  20,  '2026-07-06T08:00:00Z'),
            new LocalProduct('SKU-A003', 'Mechanical Mouse',    55,  30,  '2026-07-01T12:00:00Z'),
            new LocalProduct('SKU-A004', 'Monitor Stand',        7,  10,  '2026-07-06T08:00:00Z'),
            new LocalProduct('SKU-A005', 'Laptop Cooling Pad', 130,  40,  null),
            new LocalProduct('SKU-A006', 'Webcam 1080p',        43,  25,  '2026-07-06T08:00:00Z'),
            new LocalProduct('SKU-A007', 'HDMI 2.1 Cable (2m)',200,  80,  '2026-07-06T08:00:00Z'),
            new LocalProduct('SKU-A008', 'Desk Lamp LED',       18,  15,  '2026-07-06T08:00:00Z'),
            new LocalProduct('SKU-A009', 'Ergonomic Chair Mat',  9,  12,  '2026-07-05T10:00:00Z'),
            new LocalProduct('SKU-A010', 'Portable SSD 1TB',   60,  20,  '2026-07-06T08:00:00Z'),
        ];

        $this->knownCosts = [
            'SKU-A001' => 45.99,
            'SKU-A002' => 28.50,
            'SKU-A003' => 35.00,
            'SKU-A004' => 22.00,
            'SKU-A005' => 18.75,
            'SKU-A006' => 72.00,
            'SKU-A007' => 12.99,
            'SKU-A008' => 31.00,
            'SKU-A009' => 55.00,
            'SKU-A010' => 89.99,
        ];
    }

    /**
     * @return array<LocalProduct>
     */
    public function getAll(): array
    {
        return $this->products;
    }

    /**
     * @return array<string, float>
     */
    public function getKnownCosts(): array
    {
        return $this->knownCosts;
    }

    public function updateProduct(string $sku, int $qty, string $syncTime): void
    {
        foreach ($this->products as $product) {
            if ($product->sku === $sku) {
                $product->updateQuantity($qty);
                $product->updateLastSyncedAt($syncTime);
                return;
            }
        }
    }
}
