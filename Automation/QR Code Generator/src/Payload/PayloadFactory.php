<?php

declare(strict_types=1);

namespace MatrixCLI\Payload;

use InvalidArgumentException;
use MatrixCLI\Enums\PayloadType;

final class PayloadFactory
{
    public static function create(PayloadType $type, array $data): PayloadInterface
    {
        return match ($type) {
            PayloadType::URL => new UrlPayload($data['url'] ?? throw new InvalidArgumentException('URL required')),
            PayloadType::WIFI => new WifiPayload(
                $data['ssid'] ?? throw new InvalidArgumentException('SSID required'),
                $data['password'] ?? '',
                $data['encryption'] ?? 'WPA',
                $data['hidden'] ?? false
            ),
            PayloadType::VCARD => new VCardPayload(
                $data['first_name'] ?? throw new InvalidArgumentException('First name required'),
                $data['last_name'] ?? throw new InvalidArgumentException('Last name required'),
                $data['phone'] ?? '',
                $data['email'] ?? ''
            ),
        };
    }
}
