<?php

declare(strict_types=1);

namespace CurrencyConverter;

/**
 * CurrencyConverter — Core conversion logic.
 *
 * Wraps ApiService and performs the actual rate lookup and amount
 * calculation. Also owns the canonical list of supported currencies.
 */
final class CurrencyConverter
{
    /**
     * Supported currencies: ISO 4217 code => human-readable name.
     *
     * @var array<string, string>
     */
    public const SUPPORTED_CURRENCIES = [
        'USD' => 'US Dollar',
        'EUR' => 'Euro',
        'GBP' => 'British Pound Sterling',
        'JPY' => 'Japanese Yen',
        'AUD' => 'Australian Dollar',
        'CAD' => 'Canadian Dollar',
        'SGD' => 'Singapore Dollar',
        'CNY' => 'Chinese Yuan Renminbi',
        'KRW' => 'South Korean Won',
        'PHP' => 'Philippine Peso',
        'HKD' => 'Hong Kong Dollar',
        'INR' => 'Indian Rupee',
        'MYR' => 'Malaysian Ringgit',
        'THB' => 'Thai Baht',
        'IDR' => 'Indonesian Rupiah',
        'VND' => 'Vietnamese Dong',
        'CHF' => 'Swiss Franc',
        'NZD' => 'New Zealand Dollar',
        'SAR' => 'Saudi Riyal',
        'AED' => 'UAE Dirham',
    ];

    /** Cached rate data keyed by base currency code. */
    private array $rateCache = [];

    public function __construct(private readonly ApiService $apiService) {}

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Convert $amount from $from currency to $to currency.
     *
     * @return array{
     *     from:          string,
     *     to:            string,
     *     amount:        float,
     *     converted:     float,
     *     rate:          float,
     *     date:          string,
     *     converted_at:  string
     * }
     *
     * @throws \InvalidArgumentException for bad currency codes or amounts.
     * @throws \RuntimeException         on API errors.
     */
    public function convert(string $from, string $to, float $amount): array
    {
        $from = strtoupper(trim($from));
        $to   = strtoupper(trim($to));

        $this->validateCurrencyCode($from, 'source');
        $this->validateCurrencyCode($to, 'target');
        $this->validateAmount($amount);

        // Fetch (or use cached) rates with $from as base
        $rateData = $this->getRates($from);

        if (!isset($rateData['rates'][$to])) {
            throw new \InvalidArgumentException(
                "No rate found for target currency '{$to}'. " .
                "It may not be supported by the API for this base."
            );
        }

        $rate      = $rateData['rates'][$to];
        $converted = $amount * $rate;

        return [
            'from'         => $from,
            'to'           => $to,
            'amount'       => $amount,
            'converted'    => $converted,
            'rate'         => $rate,
            'date'         => $rateData['date'],
            'converted_at' => date('Y-m-d h:i A'),
        ];
    }

    /**
     * Return true if the given code is in the supported currencies list.
     */
    public function isSupported(string $code): bool
    {
        return isset(self::SUPPORTED_CURRENCIES[strtoupper($code)]);
    }

    /**
     * Return the full name for a currency code, or the code itself if unknown.
     */
    public function currencyName(string $code): string
    {
        $code = strtoupper($code);
        return self::SUPPORTED_CURRENCIES[$code] ?? $code;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Return cached rates for $base or fetch them from the API.
     *
     * @return array{base: string, date: string, rates: array<string, float>}
     */
    private function getRates(string $base): array
    {
        if (!isset($this->rateCache[$base])) {
            $this->rateCache[$base] = $this->apiService->fetchRates($base);
        }
        return $this->rateCache[$base];
    }

    /**
     * Validate that $code is a non-empty 3-letter string.
     *
     * @throws \InvalidArgumentException
     */
    private function validateCurrencyCode(string $code, string $label): void
    {
        if ($code === '') {
            throw new \InvalidArgumentException("The {$label} currency code cannot be empty.");
        }

        if (!preg_match('/^[A-Z]{3}$/', $code)) {
            throw new \InvalidArgumentException(
                "'{$code}' is not a valid {$label} currency code. " .
                "Codes must be exactly 3 letters (e.g. USD, EUR, PHP)."
            );
        }
    }

    /**
     * Validate that $amount is a positive finite number.
     *
     * @throws \InvalidArgumentException
     */
    private function validateAmount(float $amount): void
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException(
                'The amount must be a positive number greater than zero.'
            );
        }

        if (!is_finite($amount)) {
            throw new \InvalidArgumentException('The amount must be a finite number.');
        }
    }
}
