<?php

require 'vendor/autoload.php';

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

$options = new QROptions([
    'eccLevel' => chillerlan\QRCode\Common\EccLevel::H,
    'addQuietzone' => false,
]);

$qrcode = new QRCode($options);
$qrcode->addByteSegment('https://youtube.com');
$matrix = $qrcode->getQRMatrix();

$size = $matrix->getSize();
echo "Size: $size\n";
echo "check(0,0) dark: " . ($matrix->check(0, 0) ? 'yes' : 'no') . "\n";
echo "check(0,0) dark 2: " . ($matrix->isDark(0, 0) ? 'yes' : 'no') . "\n";
echo "matrix()[0][0]: " . ($matrix->matrix()[0][0] ?? 'null') . "\n";
$isDark = ($matrix->matrix()[0][0] >> 8) > 0;
echo "isDark bitwise: " . ($isDark ? 'yes' : 'no') . "\n";
