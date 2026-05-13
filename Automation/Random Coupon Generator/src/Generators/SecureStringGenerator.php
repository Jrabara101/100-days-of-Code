<?php

declare(strict_types=1);

namespace PromoForge\Generators;

use PromoForge\Config\CouponProfile;
use PromoForge\Validation\ChecksumEngine;

class SecureStringGenerator
{
    /**
     * Generates a cryptographically secure random string of a specified length.
     * Uses the sanitized Base32 charset from the ChecksumEngine.
     */
    public function generateRandomPart(int $length): string
    {
        $charset = ChecksumEngine::CHARSET;
        $charsetLength = strlen($charset);
        $result = '';

        for ($i = 0; $i < $length; $i++) {
            $randomIndex = random_int(0, $charsetLength - 1);
            $result .= $charset[$randomIndex];
        }

        return $result;
    }

    /**
     * Formats the final coupon code by replacing '#' in the template with random chars,
     * and optionally calculating and appending the checksum if '[C]' is present.
     */
    public function generateCode(CouponProfile $profile): string
    {
        $template = $profile->formatTemplate;
        $randomCharsNeeded = $profile->getRequiredRandomLength();
        
        $randomString = $this->generateRandomPart($randomCharsNeeded);
        
        $code = '';
        $randomIdx = 0;
        
        // Replace '#' with generated chars
        for ($i = 0; $i < strlen($template); $i++) {
            if ($template[$i] === '#') {
                $code .= $randomString[$randomIdx];
                $randomIdx++;
            } else {
                $code .= $template[$i];
            }
        }
        
        // Handle checksum if required
        if (str_contains($code, '[C]')) {
            // Calculate checksum for the code up to the [C] placeholder
            $baseStringForChecksum = str_replace('[C]', '', $code);
            $checksumChar = ChecksumEngine::calculate($baseStringForChecksum);
            $code = str_replace('[C]', $checksumChar, $code);
        }

        return $code;
    }
}
