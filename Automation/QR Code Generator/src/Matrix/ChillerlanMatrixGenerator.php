<?php

declare(strict_types=1);

namespace MatrixCLI\Matrix;

use chillerlan\QRCode\Common\EccLevel as ChillerlanEccLevel;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use MatrixCLI\Enums\EccLevel;
use MatrixCLI\Payload\PayloadInterface;

final class ChillerlanMatrixGenerator implements MatrixGeneratorInterface
{
    public function generate(PayloadInterface $payload, EccLevel $eccLevel): QRMatrix
    {
        $options = new QROptions([
            'eccLevel' => $this->mapEccLevel($eccLevel),
            'addQuietzone' => false,
        ]);

        $qrcode = new QRCode($options);
        $qrcode->addByteSegment($payload->getFormattedData());
        
        $chillerlanMatrix = $qrcode->getQRMatrix();
        $size = $chillerlanMatrix->getSize();

        $grid = [];
        for ($y = 0; $y < $size; $y++) {
            $row = [];
            for ($x = 0; $x < $size; $x++) {
                $row[] = $chillerlanMatrix->check($x, $y);
            }
            $grid[] = $row;
        }

        return new QRMatrix($size, $grid);
    }

    private function mapEccLevel(EccLevel $eccLevel): int
    {
        return match ($eccLevel) {
            EccLevel::L => ChillerlanEccLevel::L,
            EccLevel::M => ChillerlanEccLevel::M,
            EccLevel::Q => ChillerlanEccLevel::Q,
            EccLevel::H => ChillerlanEccLevel::H,
        };
    }
}
