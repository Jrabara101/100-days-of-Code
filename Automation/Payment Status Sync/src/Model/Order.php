<?php

namespace App\PaymentSync\Model;

use DateTimeImmutable;

class Order
{
    private string $id;
    private float $amount;
    private string $currency;
    private string $status;
    private DateTimeImmutable $updatedAt;

    public function __construct(
        string $id,
        float $amount,
        string $currency,
        string $status,
        DateTimeImmutable $updatedAt
    ) {
        if (!PaymentStatus::isValid($status)) {
            throw new \InvalidArgumentException("Invalid payment status: {$status}");
        }

        $this->id = $id;
        $this->amount = $amount;
        $this->currency = $currency;
        $this->status = $status;
        $this->updatedAt = $updatedAt;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getAmount(): float
    {
        return $this->amount;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * Updates the status of the order. Returns a new instance (immutability) or mutates.
     * Let's mutate it for convenience in repository updating, or return a new one.
     * We'll mutate it but also update the updatedAt timestamp.
     */
    public function transitionTo(string $newStatus): void
    {
        if (!PaymentStatus::isValid($newStatus)) {
            throw new \InvalidArgumentException("Invalid target payment status: {$newStatus}");
        }

        $this->status = $newStatus;
        $this->updatedAt = new DateTimeImmutable();
    }
}
