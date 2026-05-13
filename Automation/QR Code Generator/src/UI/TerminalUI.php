<?php

declare(strict_types=1);

namespace MatrixCLI\UI;

use MatrixCLI\Enums\EccLevel;
use MatrixCLI\Enums\PayloadType;
use MatrixCLI\Matrix\QRMatrix;
use MatrixCLI\Payload\PayloadInterface;

final class TerminalUI
{
    private const SEP = "======================================================================\n";
    private const BOLD = "\e[1m";
    private const GREEN = "\e[32m";
    private const CYAN = "\e[36m";
    private const YELLOW = "\e[33m";
    private const RESET = "\e[0m";

    public function renderDashboard(
        PayloadInterface $payload,
        EccLevel $eccLevel,
        QRMatrix $matrix,
        string $ansiRender,
        ?string $exportPath,
        float $generationTime,
        int $peakRam
    ): void {
        $phpVersion = phpversion();
        $versionNumber = ($matrix->size - 17) / 4;
        
        $ramMb = number_format($peakRam / 1024 / 1024, 1);
        $timeS = number_format($generationTime, 3);
        $exportPathStr = $exportPath ?? 'None (Stdout only)';

        echo self::BOLD . self::CYAN . "MatrixCLI v4.1.0  " . self::RESET 
            . "[Engine: PHP {$phpVersion} | ECC: Level {$eccLevel->value} ({$eccLevel->getPercentage()})]\n";
        echo self::SEP;
        
        echo self::BOLD . "[ PAYLOAD CONFIGURATION ]\n" . self::RESET;
        echo "Type        : {$payload->getType()->getLabel()}\n";
        echo "Data String : {$payload->getFormattedData()}\n";
        echo "Matrix Size : {$matrix->size}x{$matrix->size} (Version {$versionNumber})\n";
        echo "Export Path : {$exportPathStr}\n\n";

        echo self::SEP;
        echo self::BOLD . "[ LIVE TERMINAL RENDER ]\n\n" . self::RESET;
        
        echo $ansiRender . "\n";
        
        echo self::SEP;
        echo self::BOLD . self::GREEN . "[ SUCCESS ]" . self::RESET . " QR Code successfully encoded and verified.\n";
        echo "⏱ Generation Time: {$timeS}s | Peak RAM: {$ramMb} MB\n";
    }
}
