<?php

declare(strict_types=1);

namespace MatrixCLI\Enums;

enum EccLevel: string
{
    case L = 'L'; // ~7% recovery
    case M = 'M'; // ~15% recovery
    case Q = 'Q'; // ~25% recovery
    case H = 'H'; // ~30% recovery

    public function getPercentage(): string
    {
        return match ($this) {
            self::L => '7%',
            self::M => '15%',
            self::Q => '25%',
            self::H => '30%',
        };
    }
}
