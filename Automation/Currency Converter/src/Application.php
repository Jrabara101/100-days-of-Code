<?php

declare(strict_types=1);

namespace CurrencyConverter;

/**
 * Application — Main CLI controller.
 *
 * Owns the interactive menu loop and orchestrates all user interactions by
 * delegating to CurrencyConverter, HistoryService, and the helpers.php
 * formatting functions.
 */
final class Application
{
    private CurrencyConverter $converter;
    private HistoryService    $history;

    public function __construct(string $basePath)
    {
        $this->converter = new CurrencyConverter(new ApiService());
        $this->history   = new HistoryService($basePath . '/storage');
    }

    // ── Entry Point ───────────────────────────────────────────────────────────

    /**
     * Run the interactive menu loop.
     *
     * @return int  Exit code (0 = success).
     */
    public function run(): int
    {
        clear_screen();
        $this->printBanner();

        while (true) {
            $this->printMenu();
            $choice = read_input('Select an option [1-4]:');

            match ($choice) {
                '1'     => $this->handleConvert(),
                '2'     => $this->handleViewCurrencies(),
                '3'     => $this->handleViewHistory(),
                '4', '' => $this->handleExit(),
                default => $this->handleInvalidChoice(),
            };
        }

        // unreachable — handleExit() calls exit()
        return 0;
    }

    // ── Banner & Menu ─────────────────────────────────────────────────────────

    /** Print the application header banner. */
    private function printBanner(): void
    {
        $w = BOX_WIDTH;

        blank();
        out(ANSI_BRIGHT_CYAN . BOX_TL . str_repeat(BOX_H, $w - 2) . BOX_TR . ANSI_RESET);
        out(ANSI_BRIGHT_CYAN . BOX_V . ANSI_RESET
            . ANSI_BOLD . ANSI_BRIGHT_WHITE
            . center_text('  PHP CURRENCY CONVERTER  ', $w - 2)
            . ANSI_RESET
            . ANSI_BRIGHT_CYAN . BOX_V . ANSI_RESET);
        out(ANSI_BRIGHT_CYAN . BOX_V . ANSI_RESET
            . ANSI_CYAN
            . center_text('Real-Time Exchange Rates', $w - 2)
            . ANSI_RESET
            . ANSI_BRIGHT_CYAN . BOX_V . ANSI_RESET);
        out(ANSI_BRIGHT_CYAN . BOX_BL . str_repeat(BOX_H, $w - 2) . BOX_BR . ANSI_RESET);
        blank();
    }

    /** Print the main interactive menu. */
    private function printMenu(): void
    {
        $w = BOX_WIDTH;

        separator($w);
        out('');
        out('  ' . ANSI_BRIGHT_CYAN . BOX_TL . str_repeat(BOX_H, $w - 4) . BOX_TR . ANSI_RESET);
        out('  ' . ANSI_BRIGHT_CYAN . BOX_V . ANSI_RESET
            . ANSI_BOLD . ANSI_BRIGHT_YELLOW
            . center_text('M A I N   M E N U', $w - 4)
            . ANSI_RESET
            . ANSI_BRIGHT_CYAN . BOX_V . ANSI_RESET);
        out('  ' . ANSI_BRIGHT_CYAN . BOX_ML . str_repeat(BOX_H, $w - 4) . BOX_MR . ANSI_RESET);

        $items = [
            ['1', '💱', 'Convert Currency'],
            ['2', '📋', 'View Supported Currencies'],
            ['3', '🕐', 'View Conversion History'],
            ['4', '🚪', 'Exit'],
        ];

        foreach ($items as [$num, $icon, $label]) {
            $line = ' ' . ANSI_BRIGHT_YELLOW . ANSI_BOLD . "[{$num}]" . ANSI_RESET
                . " {$icon} "
                . ANSI_BRIGHT_WHITE . $label . ANSI_RESET;
            out('  ' . ANSI_BRIGHT_CYAN . BOX_V . ANSI_RESET
                . $line
                . str_repeat(' ', max(0, $w - 4 - mb_strlen("[{$num}] {$icon} {$label}") - 1))
                . ANSI_BRIGHT_CYAN . BOX_V . ANSI_RESET);
        }

        out('  ' . ANSI_BRIGHT_CYAN . BOX_BL . str_repeat(BOX_H, $w - 4) . BOX_BR . ANSI_RESET);
        blank();
    }

    // ── Menu Handlers ─────────────────────────────────────────────────────────

    /** [1] Convert Currency */
    private function handleConvert(): void
    {
        blank();
        $this->printSectionHeader('💱  CURRENCY CONVERSION', ANSI_BRIGHT_CYAN);
        blank();

        // --- Gather input ---
        $from   = read_currency_code('Base currency (e.g. USD):');
        $to     = read_currency_code('Target currency (e.g. PHP):');
        $rawAmt = read_input('Amount to convert:');

        blank();

        // --- Validate amount ---
        if (!is_numeric($rawAmt) || trim($rawAmt) === '') {
            $this->printErrorBox("Invalid amount: '{$rawAmt}'. Please enter a positive number.");
            $this->pauseForUser();
            return;
        }

        $amount = (float) $rawAmt;

        // --- Attempt conversion ---
        loading_spinner('Fetching live exchange rates');

        try {
            $result = $this->converter->convert($from, $to, $amount);
        } catch (\InvalidArgumentException $e) {
            $this->printErrorBox($e->getMessage());
            $this->pauseForUser();
            return;
        } catch (\RuntimeException $e) {
            $this->printErrorBox($e->getMessage());
            $this->pauseForUser();
            return;
        }

        // --- Show result ---
        $this->printConversionResult($result);

        // --- Save to history ---
        try {
            $this->history->save($result);
            msg_success('Conversion saved to history.');
        } catch (\RuntimeException $e) {
            msg_warning('Could not save to history: ' . $e->getMessage());
        }

        // --- Retry? ---
        blank();
        $retry = strtolower(read_input('Perform another conversion? [y/N]:'));
        if ($retry === 'y' || $retry === 'yes') {
            $this->handleConvert();
        }
    }

    /** [2] View Supported Currencies */
    private function handleViewCurrencies(): void
    {
        blank();
        $this->printSectionHeader('📋  SUPPORTED CURRENCIES', ANSI_BRIGHT_YELLOW);
        blank();

        $currencies = CurrencyConverter::SUPPORTED_CURRENCIES;
        $w          = BOX_WIDTH;

        out(ANSI_BRIGHT_YELLOW . '  ' . BOX_TL . str_repeat(BOX_H, $w - 4) . BOX_TR . ANSI_RESET);

        // Header row
        $header = ANSI_BOLD . ANSI_BRIGHT_WHITE
            . '  ' . str_pad('Code', 6)
            . str_pad('Currency Name', $w - 14)
            . ANSI_RESET;
        out('  ' . ANSI_BRIGHT_YELLOW . BOX_V . ANSI_RESET
            . $header
            . str_repeat(' ', max(0, $w - 4 - 6 - ($w - 14) - 2))
            . ANSI_BRIGHT_YELLOW . BOX_V . ANSI_RESET);

        out(ANSI_BRIGHT_YELLOW . '  ' . BOX_ML . str_repeat(BOX_H, $w - 4) . BOX_MR . ANSI_RESET);

        $i = 1;
        foreach ($currencies as $code => $name) {
            $numColor  = ($i % 2 === 0) ? ANSI_CYAN : ANSI_BRIGHT_CYAN;
            $nameColor = ($i % 2 === 0) ? ANSI_WHITE : ANSI_BRIGHT_WHITE;

            $codePad = str_pad($code, 6);
            $namePad = str_pad($name, $w - 14);

            $line = '  '
                . $numColor . ANSI_BOLD . $codePad . ANSI_RESET
                . $nameColor . $namePad . ANSI_RESET;

            $visualLen = 2 + mb_strlen($codePad) + mb_strlen($namePad);
            $padding   = max(0, $w - 4 - $visualLen);

            out('  ' . ANSI_BRIGHT_YELLOW . BOX_V . ANSI_RESET
                . $line
                . str_repeat(' ', $padding)
                . ANSI_BRIGHT_YELLOW . BOX_V . ANSI_RESET);
            $i++;
        }

        out(ANSI_BRIGHT_YELLOW . '  ' . BOX_BL . str_repeat(BOX_H, $w - 4) . BOX_BR . ANSI_RESET);
        blank();
        msg_info(count($currencies) . ' currencies listed. More may be available via the API.');

        $this->pauseForUser();
    }

    /** [3] View Conversion History */
    private function handleViewHistory(): void
    {
        blank();
        $this->printSectionHeader('🕐  CONVERSION HISTORY', ANSI_BRIGHT_MAGENTA);
        blank();

        if (!$this->history->hasEntries()) {
            msg_warning('No conversion history found. Run a conversion first.');
            $this->pauseForUser();
            return;
        }

        $entries = $this->history->recent(15);
        $w       = BOX_WIDTH;

        out(ANSI_BRIGHT_MAGENTA . '  ' . BOX_TL . str_repeat(BOX_H, $w - 4) . BOX_TR . ANSI_RESET);

        foreach ($entries as $entry) {
            $amtFormatted  = format_amount($entry['amount']);
            $convFormatted = format_amount($entry['converted']);
            $rateFormatted = number_format($entry['rate'], 6);

            // Row 1: Amount + direction
            $row1 = "  #{$entry['id']}  "
                . ANSI_BRIGHT_WHITE . ANSI_BOLD
                . "{$amtFormatted} {$entry['from']}"
                . ANSI_RESET
                . ANSI_CYAN . ' → ' . ANSI_RESET
                . ANSI_BRIGHT_GREEN . ANSI_BOLD
                . "{$convFormatted} {$entry['to']}"
                . ANSI_RESET;

            $row1Visual    = "  #{$entry['id']}  {$amtFormatted} {$entry['from']} → {$convFormatted} {$entry['to']}";
            $row1Padding   = max(0, $w - 4 - mb_strlen($row1Visual));

            out('  ' . ANSI_BRIGHT_MAGENTA . BOX_V . ANSI_RESET
                . $row1 . str_repeat(' ', $row1Padding)
                . ANSI_BRIGHT_MAGENTA . BOX_V . ANSI_RESET);

            // Row 2: Rate + date
            $row2       = "       Rate: {$rateFormatted}   {$entry['converted_at']}";
            $row2Padded = ANSI_DIM . ANSI_WHITE . str_pad($row2, $w - 4) . ANSI_RESET;

            out('  ' . ANSI_BRIGHT_MAGENTA . BOX_V . ANSI_RESET
                . $row2Padded
                . ANSI_BRIGHT_MAGENTA . BOX_V . ANSI_RESET);

            out(ANSI_DIM . '  ' . BOX_ML . str_repeat(BOX_H, $w - 4) . BOX_MR . ANSI_RESET);
        }

        // Replace last divider with bottom border
        out(ANSI_BRIGHT_MAGENTA . '  ' . BOX_BL . str_repeat(BOX_H, $w - 4) . BOX_BR . ANSI_RESET);
        blank();
        msg_info('Showing last ' . count($entries) . ' conversions. File: ' . $this->history->filePath());

        // Clear history option
        blank();
        $clear = strtolower(read_input('Clear all history? [y/N]:'));
        if ($clear === 'y' || $clear === 'yes') {
            $this->history->clear();
            msg_success('History cleared.');
        }

        $this->pauseForUser();
    }

    /** [4] Exit */
    private function handleExit(): void
    {
        blank();
        separator(BOX_WIDTH);
        out('  ' . ANSI_BRIGHT_CYAN . ANSI_BOLD . '  Thank you for using PHP Currency Converter!' . ANSI_RESET);
        out('  ' . ANSI_DIM . '  ' . date('Y-m-d h:i A') . ANSI_RESET);
        separator(BOX_WIDTH);
        blank();
        exit(0);
    }

    /** Invalid menu option. */
    private function handleInvalidChoice(): void
    {
        blank();
        msg_warning("Invalid option. Please enter 1, 2, 3, or 4.");
        blank();
    }

    // ── Display Helpers ───────────────────────────────────────────────────────

    /**
     * Render the conversion result in a styled box.
     */
    private function printConversionResult(array $result): void
    {
        $w = BOX_WIDTH;

        $amtFormatted  = format_amount($result['amount']);
        $convFormatted = format_amount($result['converted']);
        $rateLabel     = "1 {$result['from']} = " . number_format($result['rate'], 6) . " {$result['to']}";
        $fromName      = $this->converter->currencyName($result['from']);
        $toName        = $this->converter->currencyName($result['to']);

        blank();
        out(ANSI_BRIGHT_GREEN . BOX_TL . str_repeat(BOX_H, $w - 2) . BOX_TR . ANSI_RESET);
        out(ANSI_BRIGHT_GREEN . BOX_V . ANSI_RESET
            . ANSI_BOLD . ANSI_BRIGHT_WHITE
            . center_text('  CONVERSION RESULT  ✔', $w - 2)
            . ANSI_RESET
            . ANSI_BRIGHT_GREEN . BOX_V . ANSI_RESET);
        out(ANSI_BRIGHT_GREEN . BOX_ML . str_repeat(BOX_H, $w - 2) . BOX_MR . ANSI_RESET);

        $this->resultRow('Amount',       "{$amtFormatted} {$result['from']} ({$fromName})", $w, ANSI_BRIGHT_GREEN);
        $this->resultRow('Converted',    "{$convFormatted} {$result['to']} ({$toName})", $w, ANSI_BRIGHT_GREEN, ANSI_BRIGHT_GREEN);
        $this->resultRow('Rate',         $rateLabel, $w, ANSI_BRIGHT_GREEN);
        $this->resultRow('Rate Date',    $result['date'], $w, ANSI_BRIGHT_GREEN);
        $this->resultRow('Converted At', $result['converted_at'], $w, ANSI_BRIGHT_GREEN);

        out(ANSI_BRIGHT_GREEN . BOX_BL . str_repeat(BOX_H, $w - 2) . BOX_BR . ANSI_RESET);
        blank();

        // Highlighted big result line
        out('  ' . ANSI_BRIGHT_WHITE . ANSI_BOLD
            . "{$amtFormatted} {$result['from']}"
            . ANSI_RESET . '  ' . ANSI_DIM . '=' . ANSI_RESET . '  '
            . ANSI_BRIGHT_GREEN . ANSI_BOLD
            . "{$convFormatted} {$result['to']}"
            . ANSI_RESET);
        blank();
    }

    /**
     * Print a single key-value row inside a result box.
     */
    private function resultRow(
        string $key,
        string $value,
        int $width,
        string $borderColor,
        string $valueColor = ''
    ): void {
        $vc = $valueColor ?: ANSI_BRIGHT_WHITE;
        $inner  = $width - 2;

        $keyPart   = ANSI_BRIGHT_YELLOW . ANSI_BOLD . str_pad(" {$key}:", 15) . ANSI_RESET;
        $valuePart = $vc . $value . ANSI_RESET;

        $visualLen = 1 + mb_strlen("{$key}:") + 1 + mb_strlen($value);  // rough visual
        $padding   = max(0, $inner - 15 - mb_strlen($value) - 1);

        out($borderColor . BOX_V . ANSI_RESET
            . $keyPart . $valuePart
            . str_repeat(' ', $padding)
            . $borderColor . BOX_V . ANSI_RESET);
    }

    /**
     * Print a styled error box with red borders.
     */
    private function printErrorBox(string $message): void
    {
        $w     = BOX_WIDTH;
        $lines = explode("\n", wordwrap($message, $w - 6, "\n", true));

        blank();
        out(ANSI_BRIGHT_RED . BOX_TL . str_repeat(BOX_H, $w - 2) . BOX_TR . ANSI_RESET);
        out(ANSI_BRIGHT_RED . BOX_V . ANSI_RESET
            . ANSI_BOLD . ANSI_BRIGHT_RED
            . center_text('  ✖  ERROR  ✖  ', $w - 2)
            . ANSI_RESET
            . ANSI_BRIGHT_RED . BOX_V . ANSI_RESET);
        out(ANSI_BRIGHT_RED . BOX_ML . str_repeat(BOX_H, $w - 2) . BOX_MR . ANSI_RESET);

        foreach ($lines as $line) {
            $padded = '  ' . $line;
            $visual = mb_strlen($padded);
            out(ANSI_BRIGHT_RED . BOX_V . ANSI_RESET
                . ANSI_BRIGHT_WHITE . $padded . ANSI_RESET
                . str_repeat(' ', max(0, $w - 2 - $visual))
                . ANSI_BRIGHT_RED . BOX_V . ANSI_RESET);
        }

        out(ANSI_BRIGHT_RED . BOX_BL . str_repeat(BOX_H, $w - 2) . BOX_BR . ANSI_RESET);
        blank();
    }

    /**
     * Print a section header with given label and color.
     */
    private function printSectionHeader(string $title, string $color): void
    {
        $w = BOX_WIDTH;
        out($color . ANSI_BOLD . str_repeat(THIN_H, $w) . ANSI_RESET);
        out($color . ANSI_BOLD . "  {$title}" . ANSI_RESET);
        out($color . ANSI_BOLD . str_repeat(THIN_H, $w) . ANSI_RESET);
    }

    /**
     * Wait for the user to press Enter before returning to the menu.
     */
    private function pauseForUser(): void
    {
        blank();
        read_input(ANSI_DIM . 'Press [Enter] to return to menu...' . ANSI_RESET);
        blank();
        clear_screen();
        $this->printBanner();
    }
}
