<?php

namespace App\PaymentSync\Sync;

class TransitionResult
{
    public const TYPE_NO_CHANGE = 'NO_CHANGE';
    public const TYPE_SAFE_UPDATE = 'SAFE_UPDATE';
    public const TYPE_CONFLICT_REVIEW = 'CONFLICT_REVIEW';

    private string $type;
    private string $message;

    public function __construct(string $type, string $message)
    {
        $this->type = $type;
        $this->message = $message;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function isNoChange(): bool
    {
        return $this->type === self::TYPE_NO_CHANGE;
    }

    public function isSafeUpdate(): bool
    {
        return $this->type === self::TYPE_SAFE_UPDATE;
    }

    public function isConflictReview(): bool
    {
        return $this->type === self::TYPE_CONFLICT_REVIEW;
    }
}
