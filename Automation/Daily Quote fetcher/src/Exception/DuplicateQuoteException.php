<?php

declare(strict_types=1);

namespace DailyQuote\Exception;

/**
 * Thrown when a quote for today already exists on disk.
 */
class DuplicateQuoteException extends \RuntimeException {}
