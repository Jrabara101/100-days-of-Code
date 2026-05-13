<?php

declare(strict_types=1);

namespace MatrixCLI\Payload;

use MatrixCLI\Enums\PayloadType;

final readonly class WifiPayload implements PayloadInterface
{
    public function __construct(
        private string $ssid,
        private string $password,
        private string $encryption = 'WPA',
        private bool $hidden = false
    ) {}

    public function getFormattedData(): string
    {
        $hiddenStr = $this->hidden ? 'true' : 'false';
        return sprintf(
            'WIFI:T:%s;S:%s;P:%s;H:%s;;',
            $this->encryption,
            $this->ssid,
            $this->password,
            $hiddenStr
        );
    }

    public function getType(): PayloadType
    {
        return PayloadType::WIFI;
    }
}
