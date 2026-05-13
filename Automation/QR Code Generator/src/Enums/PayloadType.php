<?php

declare(strict_types=1);

namespace MatrixCLI\Enums;

enum PayloadType: string
{
    case URL = 'url';
    case WIFI = 'wifi';
    case VCARD = 'vcard';

    public function getLabel(): string
    {
        return match ($this) {
            self::URL => 'Standard URL',
            self::WIFI => 'Secure Wi-Fi Configuration',
            self::VCARD => 'Contact VCard',
        };
    }
}
