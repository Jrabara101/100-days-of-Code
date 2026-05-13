<?php

declare(strict_types=1);

namespace PromoForge\Config;

readonly class CouponProfile
{
    public function __construct(
        public string $formatTemplate,
        public int $batchSize,
        public ExportFormat $exportFormat,
        public string $exportPath,
        public bool $useChecksum = true,
        public string $campaignName = 'BLACKFRIDAY'
    ) {}

    /**
     * Extracts the number of random characters needed from the template.
     */
    public function getRequiredRandomLength(): int
    {
        return substr_count($this->formatTemplate, '#');
    }
}
