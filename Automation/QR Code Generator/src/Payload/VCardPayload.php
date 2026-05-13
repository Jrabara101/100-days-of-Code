<?php

declare(strict_types=1);

namespace MatrixCLI\Payload;

use MatrixCLI\Enums\PayloadType;

final readonly class VCardPayload implements PayloadInterface
{
    public function __construct(
        private string $firstName,
        private string $lastName,
        private string $phone,
        private string $email
    ) {}

    public function getFormattedData(): string
    {
        return sprintf(
            "BEGIN:VCARD\nVERSION:3.0\nN:%s;%s;;;\nFN:%s %s\nTEL;TYPE=CELL:%s\nEMAIL;TYPE=WORK:%s\nEND:VCARD",
            $this->lastName,
            $this->firstName,
            $this->firstName,
            $this->lastName,
            $this->phone,
            $this->email
        );
    }

    public function getType(): PayloadType
    {
        return PayloadType::VCARD;
    }
}
