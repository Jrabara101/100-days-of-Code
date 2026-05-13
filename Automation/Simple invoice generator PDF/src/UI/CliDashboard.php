<?php

declare(strict_types=1);

namespace InvioCLI\UI;

use InvioCLI\Domain\Models\Invoice;
use NumberFormatter;

class CliDashboard
{
    private const COLOR_RESET = "\033[0m";
    private const COLOR_GREEN = "\033[32m";
    private const COLOR_CYAN = "\033[36m";
    private const COLOR_YELLOW = "\033[33m";
    private const COLOR_BOLD = "\033[1m";
    private const COLOR_DIM = "\033[2m";

    public function printHeader(): void
    {
        $version = "1.5.0";
        $engine = "PHP " . PHP_VERSION;
        
        echo "\n";
        echo self::COLOR_CYAN . self::COLOR_BOLD . "InvioCLI v{$version} " . self::COLOR_RESET . self::COLOR_DIM . " [Engine: {$engine} | Renderer: Dompdf]" . self::COLOR_RESET . "\n";
        $this->printSeparator('=');
    }

    public function printCustomerInfo(Invoice $invoice): void
    {
        echo self::COLOR_BOLD . str_pad("Client", 12) . self::COLOR_RESET . ": {$invoice->customer->name} (ID: {$invoice->customer->id})\n";
        echo self::COLOR_BOLD . str_pad("Invoice No", 12) . self::COLOR_RESET . ": {$invoice->invoiceNumber}\n";
        echo self::COLOR_BOLD . str_pad("Date", 12) . self::COLOR_RESET . ": {$invoice->date}\n\n";
    }

    public function printCalculationSteps(Invoice $invoice): void
    {
        echo self::COLOR_CYAN . "[CALCULATING FINANCIALS]" . self::COLOR_RESET . "\n";
        $itemCount = count($invoice->items);
        echo self::COLOR_GREEN . "✔" . self::COLOR_RESET . " Line items parsed ({$itemCount} items)\n";
        echo self::COLOR_GREEN . "✔" . self::COLOR_RESET . " Applied {$invoice->discountPercent}% Trade Discount\n";
        echo self::COLOR_GREEN . "✔" . self::COLOR_RESET . " Computed {$invoice->taxPercent}% {$invoice->taxType->value}\n\n";
    }

    public function printFinancialSummary(Invoice $invoice): void
    {
        $currencySymbol = $invoice->currency->getSymbol();

        $this->printSeparator('=');
        echo self::COLOR_YELLOW . self::COLOR_BOLD . "FINANCIAL SUMMARY (PREVIEW)" . self::COLOR_RESET . "\n";
        $this->printSeparator('-');

        $this->printSummaryRow("Subtotal", $this->formatCurrency($invoice->subtotalCents, $currencySymbol));
        $this->printSummaryRow("Discount ({$invoice->discountPercent}%)", "-" . $this->formatCurrency($invoice->discountCents, $currencySymbol));
        $this->printSummaryRow("Tax Base", $this->formatCurrency($invoice->taxBaseCents, $currencySymbol));
        $this->printSummaryRow("{$invoice->taxType->value} ({$invoice->taxPercent}%)", $this->formatCurrency($invoice->taxCents, $currencySymbol));
        
        $this->printSeparator('-');
        
        $grandTotal = $this->formatCurrency($invoice->grandTotalCents, $currencySymbol);
        echo self::COLOR_BOLD . str_pad("GRAND TOTAL", 29) . ": {$grandTotal}" . self::COLOR_RESET . "\n";
        $this->printSeparator('=');
        echo "\n";
    }

    public function renderProgressBar(int $percent, string $message): void
    {
        $barLength = 30;
        $filledLength = (int) round($barLength * $percent / 100);
        $emptyLength = $barLength - $filledLength;
        
        $bar = str_repeat('█', $filledLength) . str_repeat('░', $emptyLength);
        
        // Use carriage return to overwrite line
        echo "\r" . self::COLOR_CYAN . "[RENDERING PDF DOCUMENT]\n" . self::COLOR_RESET;
        echo "[{$bar}] {$percent}% | {$message}\033[1A"; // \033[1A moves cursor up 1 line to allow overwriting
        
        if ($percent === 100) {
            echo "\n\n";
        }
    }

    public function printSuccess(string $outputPath, float $executionTime, float $peakRamMb): void
    {
        echo "\n" . self::COLOR_GREEN . self::COLOR_BOLD . "[SUCCESS]" . self::COLOR_RESET . " Invoice generated successfully!\n";
        echo "📂 Path: {$outputPath}\n";
        echo "⏱  Execution Time: " . number_format($executionTime, 2) . "s | Peak RAM: " . number_format($peakRamMb, 1) . " MB\n";
        $this->printSeparator('=');
        echo "\n";
    }

    private function printSeparator(char|string $char = '-'): void
    {
        echo self::COLOR_DIM . str_repeat($char, 70) . self::COLOR_RESET . "\n";
    }

    private function printSummaryRow(string $label, string $amount): void
    {
        echo str_pad($label, 29) . ": " . str_pad($amount, 15, " ", STR_PAD_LEFT) . "\n";
    }

    private function formatCurrency(int $cents, string $symbol): string
    {
        return $symbol . ' ' . number_format($cents / 100, 2);
    }
}
